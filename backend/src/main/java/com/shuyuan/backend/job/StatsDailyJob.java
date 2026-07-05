package com.shuyuan.backend.job;

import com.shuyuan.backend.service.StatsAggregationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 每日凌晨聚合前一日统计数据（docs Phase 6 定时任务）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StatsDailyJob {

    private final StatsAggregationService statsAggregationService;

    @Scheduled(cron = "0 0 1 * * ?")
    public void aggregateYesterday() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        try {
            statsAggregationService.aggregateAndSave(yesterday);
            log.info("每日统计聚合完成：{}", yesterday);
        } catch (Exception e) {
            log.error("每日统计聚合失败：{}", yesterday, e);
        }
    }
}
