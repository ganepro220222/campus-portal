package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

/**
 * 汇总健康探活与 5xx 错误率，触发 Webhook 告警。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpsAlertService {

    private static final String KEY_HEALTH = "health-down";
    private static final String KEY_ERROR_RATE = "error-rate";

    private final ShuyuanProperties properties;
    private final HealthProbeService healthProbeService;
    private final ApiErrorMetrics apiErrorMetrics;
    private final AlertWebhookService alertWebhookService;
    private final Environment environment;

    @Value("${info.app.version:0.0.1-SNAPSHOT}")
    private String version;

    /** 由定时任务调用：检查健康状态与错误率 */
    public void evaluateAndAlert() {
        if (!properties.getAlert().isEnabled()) {
            return;
        }
        checkHealth();
        checkErrorRate();
    }

    /** 供外部备份脚本或运维手动触发备份失败告警 */
    public void notifyBackupFailure(String detail) {
        alertWebhookService.sendText("backup-failed", "数据库备份失败", detail);
    }

    private void checkHealth() {
        HealthProbeService.HealthSnapshot snapshot = healthProbeService.probe();
        if (snapshot.isHealthy()) {
            return;
        }
        String detail = "profile=" + activeProfile()
                + " version=" + version
                + " db=" + snapshot.db()
                + " redis=" + snapshot.redis()
                + "\n请按运维手册 §4.1 排查。";
        alertWebhookService.sendText(KEY_HEALTH, "健康检查异常", detail);
    }

    private void checkErrorRate() {
        ShuyuanProperties.Alert alert = properties.getAlert();
        ApiErrorMetrics.Snapshot snapshot = apiErrorMetrics.snapshotAndReset();
        if (snapshot.total() < alert.getMinSampleSize()) {
            return;
        }
        double rate = snapshot.errorRatePercent();
        if (rate < alert.getErrorRatePercent()) {
            return;
        }
        String detail = "profile=" + activeProfile()
                + " version=" + version
                + "\n窗口约 " + alert.getWindowMinutes() + " 分钟"
                + "\n请求数=" + snapshot.total()
                + " 5xx=" + snapshot.errors5xx()
                + String.format(" 错误率=%.2f%%", rate)
                + "\n阈值=" + alert.getErrorRatePercent() + "%"
                + "\n请查看应用日志 traceId 定位根因。";
        alertWebhookService.sendText(KEY_ERROR_RATE, "API 5xx 错误率超阈值", detail);
    }

    private String activeProfile() {
        String[] profiles = environment.getActiveProfiles();
        return profiles.length == 0 ? "default" : String.join(",", profiles);
    }
}
