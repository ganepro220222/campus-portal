package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 微信订阅消息发件箱：与业务同事务写入，后台 worker 可靠投递。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscribeOutboxService {

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_PROCESSING = "processing";
    public static final String STATUS_SENT = "sent";
    public static final String STATUS_SKIPPED = "skipped";
    public static final String STATUS_FAILED = "failed";

    private final SubscribeOutboxMapper outboxMapper;
    private final SubscribeService subscribeService;
    private final ObjectMapper objectMapper;
    private final ShuyuanProperties properties;

    /** 报名成功/提交：与报名事务同事务写入发件箱 */
    public void enqueueEnrollSuccess(Long memberId, Activity activity, Enroll enroll) {
        if (memberId == null || activity == null || enroll == null) {
            return;
        }
        enqueue(memberId, SubscribeService.SCENE_ENROLL_SUCCESS, toPayload(activity, enroll));
    }

    /** 审核通过：与审核事务同事务写入发件箱 */
    public void enqueueEnrollApproved(Long memberId, Activity activity, Enroll enroll) {
        if (memberId == null || activity == null) {
            return;
        }
        enqueue(memberId, SubscribeService.SCENE_ENROLL_APPROVED, toPayload(activity, enroll));
    }

    /** 轮询待发/超时 processing 记录并投递 */
    public void pollPending() {
        ShuyuanProperties.Subscribe cfg = properties.getSubscribe();
        int staleMinutes = Math.max(1, cfg.getOutboxStaleMinutes());
        int batchSize = Math.max(1, cfg.getOutboxBatchSize());

        outboxMapper.resetStaleProcessing(staleMinutes);

        List<SubscribeOutbox> due = outboxMapper.selectList(new LambdaQueryWrapper<SubscribeOutbox>()
                .eq(SubscribeOutbox::getStatus, STATUS_PENDING)
                .le(SubscribeOutbox::getNextRetryAt, LocalDateTime.now())
                .orderByAsc(SubscribeOutbox::getNextRetryAt)
                .last("LIMIT " + batchSize));

        for (SubscribeOutbox row : due) {
            try {
                processOne(row.getId());
            } catch (Exception e) {
                log.warn("[subscribe-outbox] 处理 id={} 异常: {}", row.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    protected void processOne(Long outboxId) {
        if (outboxMapper.claimPending(outboxId) == 0) {
            return;
        }
        SubscribeOutbox row = outboxMapper.selectById(outboxId);
        if (row == null) {
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

    private void enqueue(Long memberId, String scene, SubscribeOutboxPayload payload) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setMemberId(memberId);
        row.setScene(scene);
        row.setPayloadJson(writePayload(payload));
        row.setStatus(STATUS_PENDING);
        row.setAttemptCount(0);
        row.setNextRetryAt(LocalDateTime.now());
        outboxMapper.insert(row);
        log.debug("[subscribe-outbox] enqueued memberId={} scene={} activityId={}",
                memberId, scene, payload.getActivityId());
    }

    private SubscribeOutboxPayload toPayload(Activity activity, Enroll enroll) {
        SubscribeOutboxPayload payload = new SubscribeOutboxPayload();
        payload.setActivityId(activity.getId());
        if (enroll != null) {
            payload.setEnrollId(enroll.getId());
            payload.setEnrollStatus(enroll.getStatus());
            payload.setVoucherCode(enroll.getVoucherCode());
        }
        payload.setActivityTitle(activity.getTitle());
        payload.setActivityStartTime(FormatUtils.formatDateTime(activity.getStartTime()));
        return payload;
    }

    private String writePayload(SubscribeOutboxPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("序列化订阅发件箱 payload 失败", e);
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
        update.setStatus(STATUS_SENT);
        update.setSentAt(LocalDateTime.now());
        update.setLockedAt(null);
        update.setLastError(null);
        outboxMapper.updateById(update);
    }

    private void markSkipped(SubscribeOutbox row, String reason) {
        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(STATUS_SKIPPED);
        update.setLastError(truncate(reason));
        update.setLockedAt(null);
        outboxMapper.updateById(update);
        log.debug("[subscribe-outbox] skipped id={} reason={}", row.getId(), reason);
    }

    private void markFailed(SubscribeOutbox row, String reason) {
        SubscribeOutbox update = new SubscribeOutbox();
        update.setId(row.getId());
        update.setStatus(STATUS_FAILED);
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
        update.setStatus(STATUS_PENDING);
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
