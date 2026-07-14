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
    private final SubscribeOutboxProcessor outboxProcessor;
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

    /**
     * 轮询待发记录并投递。
     *
     * <p>单条处理通过独立 {@link SubscribeOutboxProcessor} Bean 执行（非 self-invocation）；
     * 异常时立即将 processing 释放为 pending，stale 超时作为兜底。
     */
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
                outboxProcessor.processOne(row.getId());
            } catch (Exception e) {
                log.warn("[subscribe-outbox] 处理 id={} memberId={} scene={} attempt={} 异常: {}",
                        row.getId(), row.getMemberId(), row.getScene(), row.getAttemptCount(), e.getMessage());
                releaseProcessingToRetry(row.getId(), "处理异常: " + e.getMessage());
            }
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

    private void releaseProcessingToRetry(Long outboxId, String reason) {
        int updated = outboxMapper.releaseProcessingToRetry(outboxId, truncate(reason));
        if (updated > 0) {
            log.debug("[subscribe-outbox] released id={} to pending after exception", outboxId);
        }
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

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}
