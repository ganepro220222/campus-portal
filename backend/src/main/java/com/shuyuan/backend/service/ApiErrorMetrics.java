package com.shuyuan.backend.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 统计 API 请求与 5xx 业务码，供 E2-1 错误率告警使用。
 * 计数在固定窗口结束时由 {@link OpsAlertService} 读取并清零。
 */
@Component
public class ApiErrorMetrics {

    private final AtomicLong total = new AtomicLong();
    private final AtomicLong errors5xx = new AtomicLong();

    public void recordResultCode(Integer code) {
        total.incrementAndGet();
        if (code != null && code >= 500) {
            errors5xx.incrementAndGet();
        }
    }

    public Snapshot snapshotAndReset() {
        return new Snapshot(total.getAndSet(0), errors5xx.getAndSet(0));
    }

    public record Snapshot(long total, long errors5xx) {
        public double errorRatePercent() {
            if (total <= 0) {
                return 0;
            }
            return errors5xx * 100.0 / total;
        }
    }
}
