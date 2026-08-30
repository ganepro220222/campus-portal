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
                course, existing, new BigDecimal("98.00"), 600, 30));
    }

    @Test
    void eligibleForCompletion_allowsAfterMinWatchTime() {
        Course course = courseWithDuration(10);
        CourseProgress existing = new CourseProgress();
        existing.setProgressPercent(new BigDecimal("60.00"));

        assertTrue(CourseProgressGuard.eligibleForCompletion(
                course, existing, new BigDecimal("98.00"), 600, 120));
    }

    @Test
    void resolveMinWatchSeconds_capsAtCourseDurationForShortCourse() {
        Course oneMinute = courseWithDuration(1);
        assertEquals(60, CourseProgressGuard.resolveMinWatchSeconds(oneMinute, 60));

        Course twoMinute = courseWithDuration(2);
        assertEquals(120, CourseProgressGuard.resolveMinWatchSeconds(twoMinute, 120));
    }

    @Test
    void nextWatchedSeconds_firstReportDoesNotCreditPosition() {
        assertEquals(0, CourseProgressGuard.nextWatchedSeconds(null, 20, LocalDateTime.now()));
        assertEquals(0, CourseProgressGuard.nextWatchedSeconds(null, 30, LocalDateTime.now()));
    }

    @Test
    void nextWatchedSeconds_firstReportAtHalfThenSeekEndDoesNotCompleteOneMinuteCourse() {
        Course course = courseWithDuration(1);
        LocalDateTime t0 = LocalDateTime.now().minusSeconds(30);

        assertEquals(0, CourseProgressGuard.nextWatchedSeconds(null, 30, t0));
        CourseProgress row = new CourseProgress();
        row.setWatchedSeconds(0);
        row.setLastReportPositionSeconds(30);
        row.setLastPositionSeconds(30);
        row.setProgressPercent(new BigDecimal("50.00"));
        row.setUpdatedAt(t0);

        int watched = CourseProgressGuard.nextWatchedSeconds(row, 60, t0.plusSeconds(10));
        assertEquals(30, watched);
        assertFalse(CourseProgressGuard.eligibleForCompletion(
                course, row, new BigDecimal("95.00"), 60, watched));
    }

    @Test
    void nextWatchedSeconds_accumulatesWithTwentySecondReports() {
        CourseProgress row = new CourseProgress();
        row.setLastPositionSeconds(0);
        row.setLastReportPositionSeconds(0);
        row.setWatchedSeconds(0);
        row.setUpdatedAt(LocalDateTime.now().minusSeconds(600));

        LocalDateTime base = row.getUpdatedAt();
        for (int sec = 20; sec <= 590; sec += 20) {
            LocalDateTime now = base.plusSeconds(sec);
            int watched = CourseProgressGuard.nextWatchedSeconds(row, sec, now);
            row.setWatchedSeconds(watched);
            row.setLastPositionSeconds(sec);
            row.setLastReportPositionSeconds(sec);
            row.setProgressPercent(CourseProgressGuard.calcPercent(sec, 600));
            row.setUpdatedAt(now);
        }

        assertTrue(row.getWatchedSeconds() >= 120);
        Course course = courseWithDuration(10);
        assertTrue(CourseProgressGuard.eligibleForCompletion(
                course, row, new BigDecimal("98.33"), 600, row.getWatchedSeconds()));
    }

    @Test
    void nextWatchedSeconds_accumulatesAfterRewind() {
        CourseProgress row = new CourseProgress();
        row.setLastPositionSeconds(570);
        row.setLastReportPositionSeconds(570);
        row.setWatchedSeconds(120);
        row.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        int afterRewind = CourseProgressGuard.nextWatchedSeconds(row, 20, LocalDateTime.now());
        assertEquals(120, afterRewind);
        row.setLastReportPositionSeconds(20);
        row.setUpdatedAt(LocalDateTime.now());

        int afterResume = CourseProgressGuard.nextWatchedSeconds(row, 40, LocalDateTime.now().plusSeconds(20));
        assertEquals(140, afterResume);
    }

    @Test
    void nextWatchedSeconds_oneMinuteCourseCanReachCompletionThreshold() {
        Course course = courseWithDuration(1);
        LocalDateTime base = LocalDateTime.now().minusSeconds(120);

        assertEquals(0, CourseProgressGuard.nextWatchedSeconds(null, 0, base));
        CourseProgress row = new CourseProgress();
        row.setWatchedSeconds(0);
        row.setLastReportPositionSeconds(0);
        row.setLastPositionSeconds(0);
        row.setProgressPercent(BigDecimal.ZERO);
        row.setUpdatedAt(base);

        int[] positions = { 20, 40, 60 };
        for (int sec : positions) {
            LocalDateTime now = base.plusSeconds(sec);
            int watched = CourseProgressGuard.nextWatchedSeconds(row, sec, now);
            row.setWatchedSeconds(watched);
            row.setLastPositionSeconds(sec);
            row.setLastReportPositionSeconds(sec);
            row.setProgressPercent(CourseProgressGuard.calcPercent(sec, 60));
            row.setUpdatedAt(now);
        }

        assertEquals(60, row.getWatchedSeconds());
        row.setProgressPercent(new BigDecimal("50.00"));
        assertTrue(CourseProgressGuard.eligibleForCompletion(
                course, row, new BigDecimal("95.00"), 60, row.getWatchedSeconds()));
    }

    @Test
    void completeRemainingSlack_scalesWithDurationButCaps() {
        assertEquals(15, CourseProgressGuard.completeRemainingSlackSeconds(303));
        assertEquals(15, CourseProgressGuard.completeRemainingSlackSeconds(600));
        assertEquals(30, CourseProgressGuard.completeRemainingSlackSeconds(3600));
        assertEquals(30, CourseProgressGuard.completeRemainingSlackSeconds(7200));
    }

    @Test
    void reachedCompletePosition_shortVideoNeedsLastFifteenSeconds() {
        assertFalse(CourseProgressGuard.reachedCompletePosition(272, 303));
        assertTrue(CourseProgressGuard.reachedCompletePosition(288, 303));
        assertTrue(CourseProgressGuard.reachedCompletePosition(303, 303));
    }

    @Test
    void reachedCompletePosition_twoHourVideoDoesNotCompleteTwelveMinutesEarly() {
        int twoHours = 7200;
        assertFalse(CourseProgressGuard.reachedCompletePosition(6480, twoHours));
        assertFalse(CourseProgressGuard.reachedCompletePosition(7100, twoHours));
        assertTrue(CourseProgressGuard.reachedCompletePosition(7170, twoHours));
    }

    private static Course courseWithDuration(int minutes) {
        Course course = new Course();
        course.setDurationMinutes(minutes);
        return course;
    }
}
