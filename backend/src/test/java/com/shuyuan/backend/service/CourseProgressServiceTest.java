package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CourseProgressRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseProgress;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseProgressMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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

    @InjectMocks
    private CourseProgressService courseProgressService;

    private static final Long MEMBER_ID = 9L;
    private static final Long COURSE_ID = 3L;

    @BeforeEach
    void setUp() {
        MemberContext.setMemberId(MEMBER_ID);
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
        existing.setUpdatedAt(LocalDateTime.now().minusMinutes(3));

        when(courseProgressMapper.selectOne(any())).thenReturn(existing);
        doReturn(1).when(courseProgressMapper).updateById(any(CourseProgress.class));

        CourseProgressRequest req = new CourseProgressRequest();
        req.setLastPositionSeconds(540);
        req.setTotalDurationSeconds(600);

        Map<String, Object> vo = courseProgressService.reportProgress(COURSE_ID, req);

        assertEquals(true, vo.get("completed"));
        verify(pointService).awardCourseComplete(MEMBER_ID, COURSE_ID);
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
}
