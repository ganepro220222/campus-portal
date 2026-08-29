package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseProgress;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class CourseProgressGuardTest {

    @Test
    void validateTotalDuration_rejectsTooShort() {
        Course course = courseWithDuration(10);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseProgressGuard.validateTotalDuration(course, 1));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validateTotalDuration_rejectsMismatchWithCourseDuration() {
        Course course = courseWithDuration(10);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseProgressGuard.validateTotalDuration(course, 30));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validatePositionReport_rejectsHighFirstReport() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseProgressGuard.validatePositionReport(null, 90, 100, LocalDateTime.now()));
        assertEquals(400, ex.getCode());
    }

    @Test
    void validatePositionReport_rejectsFastJump() {
        CourseProgress existing = new CourseProgress();
        existing.setLastPositionSeconds(10);
        existing.setUpdatedAt(LocalDateTime.now());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseProgressGuard.validatePositionReport(existing, 500, 600, LocalDateTime.now()));
        assertEquals(400, ex.getCode());
    }

    @Test
    void eligibleForCompletion_requiresPriorProgressAndWatchTime() {
        Course course = courseWithDuration(10);
        CourseProgress existing = new CourseProgress();
        existing.setProgressPercent(new BigDecimal("60.00"));

        assertFalse(CourseProgressGuard.eligibleForCompletion(
                course, existing, new BigDecimal("95.00"), 600, 30));
    }

    @Test
    void eligibleForCompletion_allowsAfterMinWatchTime() {
        Course course = courseWithDuration(10);
        CourseProgress existing = new CourseProgress();
        existing.setProgressPercent(new BigDecimal("60.00"));

        assertTrue(CourseProgressGuard.eligibleForCompletion(
                course, existing, new BigDecimal("95.00"), 600, 120));
    }

    @Test
    void nextWatchedSeconds_accumulatesWithTwentySecondReports() {
        CourseProgress row = new CourseProgress();
        row.setLastPositionSeconds(0);
        row.setWatchedSeconds(0);
        row.setUpdatedAt(LocalDateTime.now().minusSeconds(600));

        LocalDateTime base = row.getUpdatedAt();
        for (int sec = 20; sec <= 540; sec += 20) {
            LocalDateTime now = base.plusSeconds(sec);
            int watched = CourseProgressGuard.nextWatchedSeconds(row, sec, now);
            row.setWatchedSeconds(watched);
            row.setLastPositionSeconds(sec);
            row.setUpdatedAt(now);
        }

        assertTrue(row.getWatchedSeconds() >= 120);
        Course course = courseWithDuration(10);
        assertTrue(CourseProgressGuard.eligibleForCompletion(
                course, row, new BigDecimal("90.00"), 600, row.getWatchedSeconds()));
    }

    @Test
    void nextWatchedSeconds_ignoresBackwardSeek() {
        CourseProgress row = new CourseProgress();
        row.setLastPositionSeconds(100);
        row.setWatchedSeconds(80);
        row.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        int watched = CourseProgressGuard.nextWatchedSeconds(row, 50, LocalDateTime.now());
        assertEquals(80, watched);
    }

    private static Course courseWithDuration(int minutes) {
        Course course = new Course();
        course.setDurationMinutes(minutes);
        return course;
    }
}
