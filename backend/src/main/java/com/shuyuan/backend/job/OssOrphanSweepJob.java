package com.shuyuan.backend.job;

import com.shuyuan.backend.service.OssMediaCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 每日扫一遍后台前缀下的孤儿对象。
 *
 * <p>排在 04:15：避开 DataRetentionJob 03:30。未保存的上传靠最短存活时间保护，不会被当天清掉。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OssOrphanSweepJob {

    private final OssMediaCleanupService ossMediaCleanupService;

    @Scheduled(cron = "0 15 4 * * ?")
    public void sweep() {
        try {
            OssMediaCleanupService.SweepReport report = ossMediaCleanupService.sweepOrphans(false);
            log.info("[oss-orphan] {}", report.toMap());
        } catch (Exception e) {
            log.error("[oss-orphan] 扫描失败", e);
        }
    }
}
