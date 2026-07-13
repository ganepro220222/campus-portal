package com.shuyuan.backend.asr;

/**
 * ASR 轮询调度策略（退避间隔、SQL 筛选条件）。
 */
public final class SubtitleAsrPollPolicy {

    private SubtitleAsrPollPolicy() {}

    public static long minPollIntervalSeconds(int attempts) {
        if (attempts < 3) {
            return 120;
        }
        if (attempts < 6) {
            return 300;
        }
        if (attempts < 12) {
            return 600;
        }
        return 1800;
    }

    /** 已到退避时间或从未轮询 */
    public static String pollDueCondition() {
        return "(subtitle_asr_last_poll_at IS NULL OR TIMESTAMPDIFF(SECOND, subtitle_asr_last_poll_at, NOW()) >= "
                + "CASE WHEN IFNULL(subtitle_asr_attempt_count,0) < 3 THEN 120 "
                + "WHEN IFNULL(subtitle_asr_attempt_count,0) < 6 THEN 300 "
                + "WHEN IFNULL(subtitle_asr_attempt_count,0) < 12 THEN 600 ELSE 1800 END)";
    }

    /** processing 超时（优先于退避，确保可被标记 failed） */
    public static String timedOutCondition(int timeoutHours) {
        int hours = Math.max(1, timeoutHours);
        return "(COALESCE(subtitle_asr_started_at, update_time) < DATE_SUB(NOW(), INTERVAL "
                + hours + " HOUR))";
    }
}
