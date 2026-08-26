package com.shuyuan.backend.job;

import com.shuyuan.backend.service.DataRetentionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 每日清理过期日志。
 *
 * <p>排在 03:30：StatsDailyJob 01:00 才把前一日的 event_log 聚合进 stat_daily，
 * 清理必须在它之后跑，否则有可能删掉还没统计的明细。保留期是 90 天量级，
 * 即便某天聚合失败也有充足的补救窗口。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataRetentionJob {

    private final DataRetentionService dataRetentionService;

    @Scheduled(cron = "0 30 3 * * ?")
    public void purgeExpired() {
        try {
            Map<String, Integer> removed = dataRetentionService.purgeExpired();
            if (removed.isEmpty()) {
                log.info("[retention] 本轮无过期数据");
            } else {
                log.info("[retention] 清理完成：{}", removed);
            }
        } catch (Exception e) {
            log.error("[retention] 清理失败", e);
        }
    }
}
