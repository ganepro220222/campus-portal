package com.shuyuan.backend.asr;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SubtitleAsrPollPolicyTest {

    @Test
    void minPollIntervalSeconds_followsBackoffLadder() {
        assertEquals(120, SubtitleAsrPollPolicy.minPollIntervalSeconds(0));
        assertEquals(120, SubtitleAsrPollPolicy.minPollIntervalSeconds(2));
        assertEquals(300, SubtitleAsrPollPolicy.minPollIntervalSeconds(3));
        assertEquals(300, SubtitleAsrPollPolicy.minPollIntervalSeconds(5));
        assertEquals(600, SubtitleAsrPollPolicy.minPollIntervalSeconds(6));
        assertEquals(1800, SubtitleAsrPollPolicy.minPollIntervalSeconds(12));
    }

    @Test
    void pollDueCondition_includesBackoffCaseExpression() {
        String sql = SubtitleAsrPollPolicy.pollDueCondition();
        assertTrue(sql.contains("subtitle_asr_last_poll_at IS NULL"));
        assertTrue(sql.contains("subtitle_asr_attempt_count"));
        assertTrue(sql.contains("THEN 120"));
        assertTrue(sql.contains("ELSE 1800"));
    }

    @Test
    void timedOutCondition_usesConfiguredHours() {
        String sql = SubtitleAsrPollPolicy.timedOutCondition(24);
        assertTrue(sql.contains("INTERVAL 24 HOUR"));
        assertTrue(sql.contains("subtitle_asr_started_at"));
    }

    @Test
    void timedOutCondition_clampsToMinimumOneHour() {
        String sql = SubtitleAsrPollPolicy.timedOutCondition(0);
        assertTrue(sql.contains("INTERVAL 1 HOUR"));
    }
}
