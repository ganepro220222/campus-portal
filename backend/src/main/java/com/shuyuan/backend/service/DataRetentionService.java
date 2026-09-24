package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.mapper.EventLogMapper;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import com.shuyuan.backend.mapper.SysLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 日志保留期清理：按时间分批删除 event_log / sys_log / subscribe_outbox。
 * subscribe_outbox 只删终态；每批带 LIMIT，单轮有上限。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataRetentionService {

    static final int DEFAULT_BATCH_SIZE = 1000;
    static final int MAX_BATCH_SIZE = 10_000;
    static final int DEFAULT_MAX_BATCHES = 200;

    private final EventLogMapper eventLogMapper;
    private final SysLogMapper sysLogMapper;
    private final SubscribeOutboxMapper outboxMapper;
    private final ShuyuanProperties properties;

    /** 单轮清理结果：表名（含终态）→ 实际删除行数；没删到的表不出现在结果里 */
    public Map<String, Integer> purgeExpired() {
        return purgeExpired(LocalDateTime.now());
    }

    /** @param now 基准时间，测试可注入 */
    public Map<String, Integer> purgeExpired(LocalDateTime now) {
        ShuyuanProperties.Retention cfg = properties.getRetention();
        Map<String, Integer> removed = new LinkedHashMap<>();
        if (!cfg.isEnabled()) {
            log.info("[retention] 已关闭（shuyuan.retention.enabled=false），本轮不删除任何数据");
            return removed;
        }
        int batch = normalizeBatchSize(cfg.getBatchSize());
        int maxBatches = normalizeMaxBatches(cfg.getMaxBatchesPerRun());

        purge(removed, "event_log", cfg.getEventLogDays(), now, batch, maxBatches,
                eventLogMapper::deleteCreatedBefore);
        purge(removed, "sys_log", cfg.getSysLogDays(), now, batch, maxBatches,
                sysLogMapper::deleteCreatedBefore);
        purge(removed, "subscribe_outbox:sent", cfg.getOutboxSentDays(), now, batch, maxBatches,
                (before, limit) -> outboxMapper.deleteByStatusBefore(SubscribeOutboxService.STATUS_SENT, before, limit));
        purge(removed, "subscribe_outbox:failed", cfg.getOutboxFailedDays(), now, batch, maxBatches,
                (before, limit) -> outboxMapper.deleteByStatusBefore(SubscribeOutboxService.STATUS_FAILED, before, limit));
        purge(removed, "subscribe_outbox:skipped", cfg.getOutboxFailedDays(), now, batch, maxBatches,
                (before, limit) -> outboxMapper.deleteByStatusBefore(SubscribeOutboxService.STATUS_SKIPPED, before, limit));
        return removed;
    }

    private void purge(Map<String, Integer> out, String label, int days, LocalDateTime now,
                       int batch, int maxBatches, BatchDeleter deleter) {
        int n = purgeTable(label, days, now, batch, maxBatches, deleter);
        if (n > 0) {
            out.put(label, n);
        }
    }

    /** 天数 &lt;= 0 表示该表不清理 */
    private int purgeTable(String label, int days, LocalDateTime now, int batch, int maxBatches, BatchDeleter deleter) {
        if (days <= 0) {
            return 0;
        }
        LocalDateTime before = now.minusDays(days);
        int total = 0;
        for (int i = 0; i < maxBatches; i++) {
            int n = deleter.delete(before, batch);
            if (n <= 0) {
                return total;
            }
            total += n;
            // 不足一整批说明存量已经追平，无需再来一轮空查询
            if (n < batch) {
                return total;
            }
        }
        log.warn("[retention] {} 触达单轮批次上限 {}（已删 {} 行），剩余留到下一轮", label, maxBatches, total);
        return total;
    }

    static int normalizeBatchSize(int value) {
        return value <= 0 ? DEFAULT_BATCH_SIZE : Math.min(value, MAX_BATCH_SIZE);
    }

    static int normalizeMaxBatches(int value) {
        return value <= 0 ? DEFAULT_MAX_BATCHES : Math.min(value, MAX_BATCH_SIZE);
    }

    /** 「删掉 before 之前的至多 limit 行」，返回实删行数 */
    @FunctionalInterface
    interface BatchDeleter {
        int delete(LocalDateTime before, int limit);
    }
}
