package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ActivityScheduleTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 9, 10, 14, 0);

    @Test
    void emptyEnrollEndDefaultsToActivityStart() {
        Activity a = published(START, null, null);
        assertNull(ActivitySchedule.effectiveEnrollStart(a));
        assertEquals(START, ActivitySchedule.effectiveEnrollEnd(a));
    }

    @Test
    void emptyWindowAllowsEnrollBeforeStart() {
        Activity a = published(START, null, null);
        assertTrue(ActivitySchedule.isEnrollWindowOpen(a, START.minusHours(2)));
        assertNull(ActivitySchedule.enrollClosedReason(a, START.minusHours(2)));
    }

    @Test
    void emptyWindowRejectsAfterStart() {
        Activity a = published(START, null, null);
        assertFalse(ActivitySchedule.isEnrollWindowOpen(a, START));
        assertFalse(ActivitySchedule.isEnrollWindowOpen(a, START.plusMinutes(1)));
        assertTrue(ActivitySchedule.enrollClosedReason(a, START).contains("已经开始"));
    }

    @Test
    void explicitEnrollEndStillClosesAfterDeadline() {
        Activity a = published(START, null, START.minusDays(1));
        assertTrue(ActivitySchedule.isEnrollWindowOpen(a, START.minusDays(2)));
        assertFalse(ActivitySchedule.isEnrollWindowOpen(a, START.minusDays(1).plusMinutes(1)));
        assertEquals("报名已截止", ActivitySchedule.enrollClosedReason(a, START.minusHours(1)));
    }

    @Test
    void validateRejectsEnrollEndAfterStart() {
        Activity a = published(START, null, START.plusHours(1));
        BusinessException ex = assertThrows(BusinessException.class, () -> ActivitySchedule.validate(a));
        assertTrue(ex.getMessage().contains("不能晚于活动开始"));
    }

    @Test
    void validateRejectsEndBeforeStart() {
        Activity a = published(START, null, null);
        a.setEndTime(START.minusHours(1));
        assertThrows(BusinessException.class, () -> ActivitySchedule.validate(a));
    }

    @Test
    void validateRejectsEnrollStartNotBeforeActivityStart() {
        Activity a = published(START, START, null);
        BusinessException ex = assertThrows(BusinessException.class, () -> ActivitySchedule.validate(a));
        assertTrue(ex.getMessage().contains("报名开始时间必须早于"));
    }

    @Test
    void validateRejectsEnrollEndBeforeEnrollStart() {
        Activity a = published(START, START.minusDays(1), START.minusDays(2));
        BusinessException ex = assertThrows(BusinessException.class, () -> ActivitySchedule.validate(a));
        assertTrue(ex.getMessage().contains("报名截止时间必须晚于报名开始"));
    }

    @Test
    void explicitEnrollStartBlocksBeforeWindow() {
        Activity a = published(START, START.minusDays(1), START.minusHours(1));
        assertFalse(ActivitySchedule.isEnrollWindowOpen(a, START.minusDays(2)));
        assertEquals("报名尚未开始", ActivitySchedule.enrollClosedReason(a, START.minusDays(2)));
        assertTrue(ActivitySchedule.isEnrollWindowOpen(a, START.minusDays(1)));
    }

    @Test
    void listState_openBeforeStartWhenEmptyWindow() {
        Activity a = published(START, null, null);
        assertEquals(ActivitySchedule.STATE_OPEN, ActivitySchedule.enrollListState(a, START.minusHours(2)));
        assertEquals("立即报名", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_OPEN));
    }

    @Test
    void listState_notStartedBeforeEnrollWindow() {
        Activity a = published(START, START.minusDays(1), START.minusHours(1));
        assertEquals(ActivitySchedule.STATE_NOT_STARTED, ActivitySchedule.enrollListState(a, START.minusDays(2)));
        assertEquals("报名未开始", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_NOT_STARTED));
    }

    @Test
    void listState_closedAfterExplicitDeadline() {
        Activity a = published(START, null, START.minusDays(1));
        assertEquals(ActivitySchedule.STATE_CLOSED, ActivitySchedule.enrollListState(a, START.minusHours(1)));
        assertEquals("报名已截止", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_CLOSED));
    }

    @Test
    void listState_startedAndEndedBeatFull() {
        Activity a = published(START, null, null);
        a.setQuota(10);
        a.setEnrolledCount(10);
        a.setEndTime(START.plusHours(2));
        assertEquals(ActivitySchedule.STATE_STARTED, ActivitySchedule.enrollListState(a, START));
        assertEquals(ActivitySchedule.STATE_ENDED, ActivitySchedule.enrollListState(a, START.plusHours(2)));
        assertEquals("进行中", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_STARTED));
        assertEquals("已结束", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_ENDED));
    }

    @Test
    void listState_noEndTimeAfterStartIsStartedNotOngoing() {
        Activity a = published(START, null, null);
        assertEquals(ActivitySchedule.STATE_STARTED_NO_END, ActivitySchedule.enrollListState(a, START));
        assertEquals(ActivitySchedule.STATE_STARTED_NO_END, ActivitySchedule.enrollListState(a, START.plusYears(1)));
        assertEquals("已开始", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_STARTED_NO_END));
    }

    @Test
    void listState_fullOnlyWhileWindowOpen() {
        Activity a = published(START, null, null);
        a.setQuota(5);
        a.setEnrolledCount(5);
        assertEquals(ActivitySchedule.STATE_FULL, ActivitySchedule.enrollListState(a, START.minusHours(1)));
        assertEquals("已满", ActivitySchedule.enrollListLabel(ActivitySchedule.STATE_FULL));
    }

    private static Activity published(LocalDateTime start, LocalDateTime enrollStart, LocalDateTime enrollEnd) {
        Activity a = new Activity();
        a.setStatus("published");
        a.setStartTime(start);
        a.setEnrollStartTime(enrollStart);
        a.setEnrollEndTime(enrollEnd);
        return a;
    }
}
