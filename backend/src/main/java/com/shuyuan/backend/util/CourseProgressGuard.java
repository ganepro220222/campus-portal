package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseProgress;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 课程进度上报风控：校验客户端时长/位置，控制完成与积分触发条件。
 */
public final class CourseProgressGuard {

    public static final int MIN_TOTAL_SECONDS = 30;
    public static final int MAX_TOTAL_SECONDS = 8 * 3600;
    public static final BigDecimal FIRST_REPORT_MAX_PERCENT = new BigDecimal("50.00");
    public static final BigDecimal COMPLETE_THRESHOLD = new BigDecimal("90.00");
    public static final BigDecimal PRIOR_PROGRESS_MIN_PERCENT = new BigDecimal("5.00");
    public static final double MAX_PLAYBACK_RATE = 2.0;
    public static final int JUMP_BUFFER_SECONDS = 10;
    public static final double MIN_WATCH_RATIO = 0.15;
    public static final int MIN_WATCH_SECONDS_FLOOR = 120;
    public static final double TOTAL_TOLERANCE_LOW = 0.5;
    public static final double TOTAL_TOLERANCE_HIGH = 2.0;

    private CourseProgressGuard() {}

    public static void validateTotalDuration(Course course, int totalSeconds) {
        if (totalSeconds < MIN_TOTAL_SECONDS) {
            throw new BusinessException(400, "视频总时长异常");
        }
        if (totalSeconds > MAX_TOTAL_SECONDS) {
            throw new BusinessException(400, "视频总时长异常");
        }
        Integer durationMinutes = course.getDurationMinutes();
        if (durationMinutes != null && durationMinutes > 0) {
            int expected = durationMinutes * 60;
            int low = (int) (expected * TOTAL_TOLERANCE_LOW);
            int high = (int) (expected * TOTAL_TOLERANCE_HIGH);
            if (totalSeconds < low || totalSeconds > high) {
                throw new BusinessException(400, "视频总时长与课程时长不匹配");
            }
        }
    }

    public static void validatePositionReport(CourseProgress existing, int incomingPosition,
                                              int totalSeconds, LocalDateTime now) {
        if (totalSeconds <= 0) {
            return;
        }
        if (incomingPosition > totalSeconds) {
            throw new BusinessException(400, "播放位置不能超过总时长");
        }
        BigDecimal incomingPercent = calcPercent(incomingPosition, totalSeconds);
        if (existing == null) {
            if (incomingPercent.compareTo(FIRST_REPORT_MAX_PERCENT) > 0) {
                throw new BusinessException(400, "首次进度上报异常，请继续观看后重试");
            }
            return;
        }
        int existingPos = existing.getLastPositionSeconds() != null ? existing.getLastPositionSeconds() : 0;
        LocalDateTime lastAt = existing.getUpdatedAt() != null ? existing.getUpdatedAt() : now;
        long elapsed = Math.max(0, Duration.between(lastAt, now).getSeconds());
        int maxJump = (int) (elapsed * MAX_PLAYBACK_RATE) + JUMP_BUFFER_SECONDS;
        if (incomingPosition > existingPos + maxJump) {
            throw new BusinessException(400, "进度上报过快，请正常观看后重试");
        }
    }

    /**
     * 是否允许将本次上报视为「完成」并触发积分（与续播进度存储分离）。
     */
    public static boolean eligibleForCompletion(Course course, CourseProgress existing,
                                              BigDecimal mergedPercent, int mergedTotal, LocalDateTime now) {
        if (existing == null || mergedPercent.compareTo(COMPLETE_THRESHOLD) < 0) {
            return false;
        }
        BigDecimal priorPercent = existing.getProgressPercent() != null
                ? existing.getProgressPercent() : BigDecimal.ZERO;
        if (priorPercent.compareTo(PRIOR_PROGRESS_MIN_PERCENT) < 0) {
            return false;
        }
        int expectedTotal = resolveExpectedTotalSeconds(course, mergedTotal);
        int minWatch = Math.max(MIN_WATCH_SECONDS_FLOOR, (int) (expectedTotal * MIN_WATCH_RATIO));
        LocalDateTime lastAt = existing.getUpdatedAt() != null ? existing.getUpdatedAt() : now;
        long elapsed = Math.max(0, Duration.between(lastAt, now).getSeconds());
        return elapsed >= minWatch;
    }

    public static int resolveExpectedTotalSeconds(Course course, int reportedTotal) {
        Integer durationMinutes = course.getDurationMinutes();
        if (durationMinutes != null && durationMinutes > 0) {
            return durationMinutes * 60;
        }
        return Math.max(reportedTotal, MIN_TOTAL_SECONDS);
    }

    public static BigDecimal calcPercent(int position, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        double raw = Math.min(100.0, position * 100.0 / total);
        return BigDecimal.valueOf(raw).setScale(2, RoundingMode.HALF_UP);
    }
}
