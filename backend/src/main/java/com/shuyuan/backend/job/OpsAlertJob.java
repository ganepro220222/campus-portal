package com.shuyuan.backend.job;

import com.shuyuan.backend.service.OpsAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * E2-1 低成本告警：每 5 分钟评估健康状态与 5xx 错误率。
 * 仅在 shuyuan.alert.enabled=true 时启用。
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "shuyuan.alert", name = "enabled", havingValue = "true")
public class OpsAlertJob {

    private final OpsAlertService opsAlertService;

    @Scheduled(cron = "0 */5 * * * ?")
    public void run() {
        try {
            opsAlertService.evaluateAndAlert();
        } catch (Exception e) {
            log.warn("运维告警任务执行异常: {}", e.getMessage());
        }
    }
}
