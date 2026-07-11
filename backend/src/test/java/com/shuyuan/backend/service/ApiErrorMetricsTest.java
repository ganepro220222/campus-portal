package com.shuyuan.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiErrorMetricsTest {

    private ApiErrorMetrics metrics;

    @BeforeEach
    void setUp() {
        metrics = new ApiErrorMetrics();
    }

    @Test
    void recordResultCode_counts5xxOnly() {
        metrics.recordResultCode(200);
        metrics.recordResultCode(400);
        metrics.recordResultCode(500);
        metrics.recordResultCode(503);

        ApiErrorMetrics.Snapshot snapshot = metrics.snapshotAndReset();
        assertEquals(4, snapshot.total());
        assertEquals(2, snapshot.errors5xx());
        assertEquals(50.0, snapshot.errorRatePercent(), 0.01);
    }

    @Test
    void snapshotAndReset_clearsCounters() {
        metrics.recordResultCode(500);
        metrics.snapshotAndReset();

        ApiErrorMetrics.Snapshot second = metrics.snapshotAndReset();
        assertEquals(0, second.total());
        assertEquals(0, second.errors5xx());
    }

    @Test
    void errorRatePercent_returnsZeroWhenNoRequests() {
        assertEquals(0, metrics.snapshotAndReset().errorRatePercent());
    }
}
