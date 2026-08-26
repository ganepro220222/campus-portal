package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 单条 outbox 投递处理。独立 Bean，供 {@link SubscribeOutboxService} 通过 Spring 代理调用。
 *
 * <p>不使用类级事务：认领与终态更新各自为单条 SQL；微信 HTTP 在事务外执行，避免长事务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscribeOutboxProcessor {

    private final SubscribeOutboxMapper outboxMapper;
    private final SubscribeService subscribeService;
    private final ObjectMapper objectMapper;
    private final ShuyuanProperties properties;

    public void processOne(Long outboxId) {
        if (outboxMapper.claimPending(outboxId) == 0) {
            return;
        }
        SubscribeOutbox row = outboxMapper.selectById(outboxId);
        if (row == null) {
            outboxMapper.releaseProcessingToRetry(outboxId, "记录不存在");
            return;
        }

        int maxAttempts = Math.max(1, properties.getSubscribe().getOutboxMaxAttempts());
        if (row.getAttemptCount() != null && row.getAttemptCount() > maxAttempts) {
            markFailed(row, "超过最大重试次数");
            return;
        }

        SubscribeOutboxPayload payload = parsePayload(row.getPayloadJson());
        if (payload == null) {
            markFailed(row, "payload 解析失败");
            return;
        }

        SubscribeSendOutcome outcome = subscribeService.deliverForScene(
                row.getMemberId(), row.getScene(), payload);
        switch (outcome) {
            case SENT -> markSent(row);
            case SKIPPED_NO_AUTH, SKIPPED_NO_OPENID, SKIPPED_NO_TEMPLATE, SKIPPED_INVALID_PAYLOAD -> markSkipped(row, outcome.name());
            case PERMANENT_FAILURE -> markFailed(row, "微信返回不可重试错误");
            case RETRYABLE_FAILURE -> scheduleRetry(row, "发送失败，等待重试");
            default -> scheduleRetry(row, "未知投递结果");
        }
    }

    private SubscribeOutboxPayload parsePayload(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, SubscribeOutboxPayload.class);
        } catch (JsonProcessingException e) {
            log.warn("[subscribe-outbox] payload 解析失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 标记发送成功。
     *
     * <p>last_error / locked_at 必须走 LambdaUpdateWrapper：MyBatis-Plus 的 updateStrategy
     * 默认 NOT_NULL，{@code setXxx(null)} + updateById 压根不会把这两列写进 SET。
     * 先失败重试、后来发成功的记录会一直带着旧的失败原因，
     * 后台「通知发送记录」页就会显示成「已发送」却挂着一条失败原因与处置建议。
     */
    private void markSent(SubscribeOutbox row) {
        outboxMapper.update(null, new LambdaUpdateWrapper<SubscribeOutbox>()
                .eq(SubscribeOutbox::getId, row.getId())
                .set(SubscribeOutbox::getStatus, SubscribeOutboxService.STATUS_SENT)
                .set(SubscribeOutbox::getSentAt, LocalDateTime.now())
                .set(SubscribeOutbox::getLockedAt, null)
                .set(SubscribeOutbox::getLastError, null));
    }

    private void markSkipped(SubscribeOutbox row, String reason) {
        outboxMapper.update(null, new LambdaUpdateWrapper<SubscribeOutbox>()
                .eq(SubscribeOutbox::getId, row.getId())
                .set(SubscribeOutbox::getStatus, SubscribeOutboxService.STATUS_SKIPPED)
                .set(SubscribeOutbox::getLastError, truncate(reason))
                .set(SubscribeOutbox::getLockedAt, null));
        log.debug("[subscribe-outbox] skipped id={} reason={}", row.getId(), reason);
    }

    private void markFailed(SubscribeOutbox row, String reason) {
        outboxMapper.update(null, new LambdaUpdateWrapper<SubscribeOutbox>()
                .eq(SubscribeOutbox::getId, row.getId())
                .set(SubscribeOutbox::getStatus, SubscribeOutboxService.STATUS_FAILED)
                .set(SubscribeOutbox::getLastError, truncate(reason))
                .set(SubscribeOutbox::getLockedAt, null));
        log.warn("[subscribe-outbox] failed id={} memberId={} scene={} reason={}",
                row.getId(), row.getMemberId(), row.getScene(), reason);
    }

    private void scheduleRetry(SubscribeOutbox row, String reason) {
        int attempt = row.getAttemptCount() != null ? row.getAttemptCount() : 1;
        int maxAttempts = Math.max(1, properties.getSubscribe().getOutboxMaxAttempts());
        if (attempt >= maxAttempts) {
            markFailed(row, "超过最大重试次数: " + truncate(reason));
            return;
        }
        int baseSeconds = Math.max(5, properties.getSubscribe().getOutboxRetryBaseSeconds());
        long delaySeconds = Math.min(3600L, (long) baseSeconds * (1L << Math.min(attempt - 1, 10)));

        outboxMapper.update(null, new LambdaUpdateWrapper<SubscribeOutbox>()
                .eq(SubscribeOutbox::getId, row.getId())
                .set(SubscribeOutbox::getStatus, SubscribeOutboxService.STATUS_PENDING)
                .set(SubscribeOutbox::getLastError, truncate(reason))
                .set(SubscribeOutbox::getNextRetryAt, LocalDateTime.now().plusSeconds(delaySeconds))
                .set(SubscribeOutbox::getLockedAt, null));
        log.debug("[subscribe-outbox] retry scheduled id={} attempt={} delaySec={}",
                row.getId(), attempt, delaySeconds);
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}
