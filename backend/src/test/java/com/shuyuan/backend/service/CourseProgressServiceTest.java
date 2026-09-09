package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.CourseProgressRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseProgress;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseProgressMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 课程进度：完成判定与积分触发
 */
@ExtendWith(MockitoExtension.class)
class CourseProgressServiceTest {

    @Mock
    private CourseProgressMapper courseProgressMapper;
    @Mock
    private CourseMapper courseMapper;
    @Mock
    private PointService pointService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private RateLimitService rateLimitService;

    private ShuyuanProperties properties;
    private CourseProgressService courseProgressService;

    private static final Long MEMBER_ID = 9L;
    private static final Long COURSE_ID = 3L;

    @BeforeEach
    void setUp() {
        MemberContext.setMemberId(MEMBER_ID);
        properties = new ShuyuanProperties();
        properties.getRateLimit().setCourseCompletePerHour(5);
        courseProgressService = new CourseProgressService(
                courseProgressMapper, courseMapper, pointService, eventLogService,
                rateLimitService, properties);
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    private void stubPublishedCourse() {
        stubPublishedCourse(10);
    }

    private void stubPublishedCourse(int durationMinutes) {
        Course course = new Course();
        course.setId(COURSE_ID);
        course.setStatus(1);
        course.setDurationMinutes(durationMinutes);
        when(courseMapper.selectById(COURSE_ID)).thenReturn(course);
    }

    @Test
    void reportProgress_awardsPoints_afterGradualWatch() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(300);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("50.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(120);
        existing.setLastReportPositionSeconds(300);
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(3));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(true);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(590);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
        verify(eventLogService).record("complete", "course", COURSE_ID);
    }

    @Test
    void reportProgress_skipsPointsWhenHourlyCompleteLimitExceeded() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(300);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("50.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(120);
        existing.setLastReportPositionSeconds(300);
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(3));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(false);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(590);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
        verify(eventLogService).record("complete", "course", COURSE_ID);
    }

    @Test
    void reportProgress_rejectsForgedOneSecondComplete() {
        stubPublishedCourse();
        when(courseProgressMapper.selectOne(any())).thenReturn(null);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(1);
        req.setTotalDurationSeconds(1);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> courseProgressService.reportProgress(COURSE_ID, req));
        assertEquals(400, ex.getCode());
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_rejectsFirstReportAboveFiftyPercent() {
        stubPublishedCourse();
        when(courseProgressMapper.selectOne(any())).thenReturn(null);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(90);
        req.setTotalDurationSeconds(100);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> courseProgressService.reportProgress(COURSE_ID, req));
        assertEquals(400, ex.getCode());
        verify(courseProgressMapper, never()).insert(any(CourseProgress.class));
    }

    @Test
    void reportProgress_doesNotAwardOnFirstReportEvenAtNinetyPercent() {
        stubPublishedCourse();
        when(courseProgressMapper.selectOne(any())).thenReturn(null);
        doReturn(1).when(courseProgressMapper).insert(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(270);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(new BigDecimal("45.00"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_requiresLogin() {
        MemberContext.clear();
        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(10);
        req.setTotalDurationSeconds(100);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> courseProgressService.reportProgress(COURSE_ID, req));
        assertEquals(401, ex.getCode());
    }

    @Test
    void reportProgress_noDuplicateAward_whenAlreadyCompleted() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setCompleted(1);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(5));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(580);
        req.setTotalDurationSeconds(600);

        courseProgressService.reportProgress(COURSE_ID, req);

        verify(pointService, never()).award(anyLong(), anyString());
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_doesNotRollbackCompleted_whenZeroTotalReported() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setCompleted(1);
        existing.setLastPositionSeconds(540);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(5));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(100);
        req.setTotalDurationSeconds(0);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        assertEquals(new BigDecimal("95.00"), vo.get("progressPercent"));
        assertEquals(600, vo.get("totalDurationSeconds"));
        assertEquals(540, vo.get("lastPositionSeconds"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_storesHighProgressWithoutCompletingWhenWatchTimeInsufficient() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(530);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("88.33"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(30);
        existing.setLastReportPositionSeconds(530);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(30));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(540);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(new BigDecimal("90.00"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_completesAfterPeriodicTwentySecondReports() {
        stubPublishedCourse(10);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(520);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("86.67"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(100);
        existing.setLastReportPositionSeconds(520);
        // 20 秒间隔最多认 50 秒进度（2 倍速 + 10 秒缓冲）；70 秒跳跃会被风控拒掉
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(40));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(true);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(590);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
        verify(eventLogService).record("complete", "course", COURSE_ID);
    }

    @Test
    void reportProgress_migratedHighProgressWithBackfilledWatch_canComplete() {
        stubPublishedCourse(10);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(570);
        existing.setLastReportPositionSeconds(570);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(120);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(true);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(600);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
    }

    @Test
    void reportProgress_oneMinuteCourseCompletesWhenFullyWatched() {
        stubPublishedCourse(1);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(54);
        existing.setLastReportPositionSeconds(54);
        existing.setTotalDurationSeconds(60);
        existing.setProgressPercent(new BigDecimal("90.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(54);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(true);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(60);
        req.setTotalDurationSeconds(60);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
    }

    @Test
    void mergeProgress_neverDecreasesPercent() {
        CourseProgress existing = new CourseProgress();
        existing.setCompleted(1);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setTotalDurationSeconds(600);
        existing.setLastPositionSeconds(540);

        var snapshot = courseProgressService.mergeProgress(existing, 0, 0);

        assertEquals(new BigDecimal("95.00"), snapshot.percent());
        assertEquals(540, snapshot.position());
    }

    @Test
    void mergeProgress_rewindUpdatesResumeKeepsMaxPercent() {
        CourseProgress existing = new CourseProgress();
        existing.setProgressPercent(new BigDecimal("66.67"));
        existing.setTotalDurationSeconds(1800);
        existing.setLastPositionSeconds(1200);

        var snapshot = courseProgressService.mergeProgress(existing, 720, 1800);

        assertEquals(720, snapshot.position());
        assertEquals(new BigDecimal("66.67"), snapshot.percent());
        assertEquals(1800, snapshot.total());
    }

    @Test
    void reportProgress_rewindSavesResumePosition() {
        stubPublishedCourse(30);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(1200);
        existing.setLastReportPositionSeconds(1200);
        existing.setTotalDurationSeconds(1800);
        existing.setProgressPercent(new BigDecimal("66.67"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(200);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(600);
        req.setTotalDurationSeconds(1800);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(600, vo.get("lastPositionSeconds"));
        assertEquals(new BigDecimal("66.67"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));

        ArgumentCaptor<CourseProgress> captor = ArgumentCaptor.forClass(CourseProgress.class);
        verify(courseProgressMapper).updateById(captor.capture());
        assertEquals(600, captor.getValue().getLastReportPositionSeconds());
        assertEquals(200, captor.getValue().getWatchedSeconds());
    }

    @Test
    void reportProgress_rewindThenContinueUpdatesResumeWithoutDroppingPercent() {
        stubPublishedCourse(30);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(600);
        existing.setLastReportPositionSeconds(600);
        existing.setTotalDurationSeconds(1800);
        existing.setProgressPercent(new BigDecimal("66.67"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(200);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(720);
        req.setTotalDurationSeconds(1800);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(720, vo.get("lastPositionSeconds"));
        assertEquals(new BigDecimal("66.67"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
    }

    @Test
    void reportProgress_doesNotCompleteFromHistoricalMaxWhileRewound() {
        stubPublishedCourse(10);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(570);
        existing.setLastReportPositionSeconds(570);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(200);
        existing.setUpdatedAt(LocalDateTime.now().minusSeconds(20));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(240);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(240, vo.get("lastPositionSeconds"));
        assertEquals(new BigDecimal("95.00"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void reportProgress_completesWhenRewoundUserReachesTailAgain() {
        stubPublishedCourse(10);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(240);
        existing.setLastReportPositionSeconds(240);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("95.00"));
        existing.setCompleted(0);
        existing.setWatchedSeconds(200);
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(3));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));
        when(rateLimitService.tryAcquireUser(eq("course-complete"), eq(MEMBER_ID), eq(5), eq(Duration.ofHours(1))))
                .thenReturn(true);

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(590);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        assertEquals(590, vo.get("lastPositionSeconds"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
    }

    @Test
    void reportProgress_completedRewatchDoesNotReaward() {
        stubPublishedCourse(10);
        CourseProgress existing = new CourseProgress();
        existing.setId(1L);
        existing.setMemberId(MEMBER_ID);
        existing.setCourseId(COURSE_ID);
        existing.setCompleted(1);
        existing.setLastPositionSeconds(590);
        existing.setLastReportPositionSeconds(590);
        existing.setTotalDurationSeconds(600);
        existing.setProgressPercent(new BigDecimal("100.00"));
        existing.setWatchedSeconds(200);
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(5));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(10);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        assertEquals(10, vo.get("lastPositionSeconds"));
        assertEquals(new BigDecimal("100.00"), vo.get("progressPercent"));
        verify(pointService, never()).awardCourseComplete(anyLong(), anyLong());
    }

    @Test
    void getProgress_whenMissing_returnsZeroAndNotCompleted() {
        stubPublishedCourse();
        when(courseProgressMapper.selectOne(any())).thenReturn(null);

        Map<String, Object> vo = courseProgressService.getProgress(COURSE_ID);

        assertEquals(0, vo.get("lastPositionSeconds"));
        assertEquals(0, vo.get("totalDurationSeconds"));
        assertEquals(BigDecimal.ZERO, vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
    }

    @Test
    void getProgress_returnsSavedResumeAndHighestPercent() {
        stubPublishedCourse();
        CourseProgress existing = new CourseProgress();
        existing.setCourseId(COURSE_ID);
        existing.setLastPositionSeconds(720);
        existing.setTotalDurationSeconds(1800);
        existing.setProgressPercent(new BigDecimal("66.67"));
        existing.setCompleted(0);
        when(courseProgressMapper.selectOne(any())).thenReturn(existing);

        Map<String, Object> vo = courseProgressService.getProgress(COURSE_ID);

        assertEquals(720, vo.get("lastPositionSeconds"));
        assertEquals(1800, vo.get("totalDurationSeconds"));
        assertEquals(new BigDecimal("66.67"), vo.get("progressPercent"));
        assertEquals(false, vo.get("completed"));
    }

    @Test
    void countLearners_returnsZeroForNullCourse() {
        assertEquals(0L, courseProgressService.countLearners(null));
        verify(courseProgressMapper, never()).selectCount(any());
    }

    @Test
    void countLearners_readsMapperCount() {
        when(courseProgressMapper.selectCount(any())).thenReturn(4L);
        assertEquals(4L, courseProgressService.countLearners(COURSE_ID));
    }

    @Test
    void clearForReplacedVideo_deletesRowsForCourse() {
        when(courseProgressMapper.delete(any())).thenReturn(3);

        assertEquals(3, courseProgressService.clearForReplacedVideo(COURSE_ID));
        verify(courseProgressMapper).delete(any());
    }

    @Test
    void clearForReplacedVideo_skipsNullCourse() {
        assertEquals(0, courseProgressService.clearForReplacedVideo(null));
        verify(courseProgressMapper, never()).delete(any());
    }
}
