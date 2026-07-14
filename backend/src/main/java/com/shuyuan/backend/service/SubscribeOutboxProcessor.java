package com.shuyuan.backend.service;

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
            case SKIPPED_NO_AUTH, SKIPPED_NO_OPENID, SKIPPED_NO_TEMPLATE -> markSkipped(row, outcome.name());
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

    private void markSent(SubscribeOutbox row) {
        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(SubscribeOutboxService.STATUS_SENT);
        update.setSentAt(LocalDateTime.now());
        update.setLockedAt(null);
        update.setLastError(null);
        outboxMapper.updateById(update);
    }

    private void markSkipped(SubscribeOutbox row, String reason) {
        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(SubscribeOutboxService.STATUS_SKIPPED);
        update.setLastError(truncate(reason));
        update.setLockedAt(null);
        outboxMapper.updateById(update);
        log.debug("[subscribe-outbox] skipped id={} reason={}", row.getId(), reason);
    }

    private void markFailed(SubscribeOutbox row, String reason) {
        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(SubscribeOutboxService.STATUS_FAILED);
        update.setLastError(truncate(reason));
        update.setLockedAt(null);
        outboxMapper.updateById(update);
        log.warn("[subscribe-outbox] failed id={} memberId={} scene={} reason={}",
                row.getId(), row.getMemberId(), row.getScene(), reason);
    }

    private void scheduleRetry(SubscribeOutbox row, String reason) {
        int attempt = row.getAttemptCount() != null ? row.getAttemptCount() : 1;
        int maxAttempts = Math.max(1, properties.getSubscribe().getOutboxMaxAttempts());
        if (attempt >= maxAttempts) {
            markFailed(row, truncate(reason) + " (已达最大重试)");
            return;
        }
        int baseSeconds = Math.max(5, properties.getSubscribe().getOutboxRetryBaseSeconds());
        long delaySeconds = Math.min(3600L, (long) baseSeconds * (1L << Math.min(attempt - 1, 10)));

        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(SubscribeOutboxService.STATUS_PENDING);
        update.setLastError(truncate(reason));
        update.setNextRetryAt(LocalDateTime.now().plusSeconds(delaySeconds));
        update.setLockedAt(null);
        outboxMapper.updateById(update);
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
