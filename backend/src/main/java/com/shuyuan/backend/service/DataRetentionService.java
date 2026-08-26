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
 * 日志类数据保留：把超过保留期的 event_log / sys_log / subscribe_outbox 分批删掉。
 *
 * <p>为什么需要：这三张表原先只写不删。event_log 是学生端每次浏览/点赞/收藏/分享/下载/
 * 报名/播放都写一行，按 DAU 5000、人均 20 次交互估算约 10 万行/天，一年 5GB 量级——
 * 而它的统计价值在 StatsDailyJob 每日聚合进 stat_daily 之后就基本用尽了。
 *
 * <p>三条安全约束：
 * <ul>
 *   <li>只按时间删，且每条 DELETE 带 LIMIT，避免长事务锁住学生端还在写的表；</li>
 *   <li>subscribe_outbox 只删 sent / failed / skipped 这些<b>终态</b>，pending 与 processing
 *       是还没投递完的活儿，任何时候都不碰；</li>
 *   <li>单表单轮有批次上限，一次运行删不完就留到下一轮，不会把数据库占死。</li>
 * </ul>
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

    /** 天数 &lt;= 0 表示该表不清理——留给甲方按合规要求自行放开 */
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
