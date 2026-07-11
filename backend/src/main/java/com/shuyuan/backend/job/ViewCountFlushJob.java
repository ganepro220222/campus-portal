package com.shuyuan.backend.job;

import com.shuyuan.backend.service.ViewCountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 每 5 分钟将 Redis 浏览量增量落库（docs Phase 6）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewCountFlushJob {

    private final ViewCountService viewCountService;

    @Scheduled(cron = "0 */5 * * * ?")
    public void flushViewCounters() {
        try {
            int flushed = viewCountService.flushPendingCounts();
            if (flushed > 0) {
                log.info("浏览量落库完成，更新 {} 条", flushed);
            }
        } catch (Exception e) {
            log.error("浏览量落库失败", e);
        }
    }
}
