package com.shuyuan.backend.service;

import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.asr.AsrProvider;
import com.shuyuan.backend.asr.DisabledAsrProvider;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CourseSaveRequest;
import com.shuyuan.backend.dto.SubtitleUpdateRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsNonNullColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCourseServiceSubtitleTest {

    /** triggerSubtitle 要把 last_poll_at / last_error 写成 NULL，走 LambdaUpdateWrapper */
    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Course.class);
    }

    @Mock
    private CourseMapper courseMapper;
    @Mock
    private com.shuyuan.backend.mapper.CourseResourceMapper courseResourceMapper;
    @Mock
    private com.shuyuan.backend.mapper.ResourceMapper resourceMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;
    @Mock
    private AsrService asrService;
    @Mock
    private OssService ossService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

    @InjectMocks
    private AdminCourseService adminCourseService;

    @Test
    void triggerSubtitle_rejectsWhenAsrNotConfigured() {
        Course course = new Course();
        course.setId(9L);
        course.setVideoUrl("videos/demo.mp4");
        course.setSubtitleStatus("none");
        when(courseMapper.selectByIdForUpdate(9L)).thenReturn(course);
        when(asrService.isConfigured()).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminCourseService.triggerSubtitle(9L));

        assertEquals(503, ex.getCode());
        verify(courseMapper, never()).update(isNull(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void triggerSubtitle_submitsAsrTask() {
        Course course = new Course();
        course.setId(10L);
        course.setVideoUrl("videos/demo.mp4");
        course.setSubtitleStatus("none");
        when(courseMapper.selectByIdForUpdate(10L)).thenReturn(course);
        when(courseMapper.selectById(10L)).thenReturn(course);
        when(asrService.isConfigured()).thenReturn(true);
        when(ossService.signTrustedVideoUrlForAsr("videos/demo.mp4"))
                .thenReturn("https://cdn.example.com/videos/demo.mp4");
        when(asrService.submit("https://cdn.example.com/videos/demo.mp4")).thenReturn("task-abc");

        adminCourseService.triggerSubtitle(10L);

        ArgumentCaptor<LambdaUpdateWrapper<Course>> cap = updateCaptor();
        verify(courseMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "subtitle_status", "processing");
        assertSetsColumn(cap.getValue(), "subtitle_task_id", "task-abc");
        assertSetsColumn(cap.getValue(), "subtitle_asr_attempt_count", 0);
        assertSetsNonNullColumn(cap.getValue(), "subtitle_asr_started_at");
        // 重新发起转写要清掉上一轮的轮询时间与报错，否则新任务一开始就带着旧错误
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_poll_at", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_error", null);
    }

    @Test
    void triggerSubtitle_rejectsUntrustedVideoUrl() {
        Course course = new Course();
        course.setId(11L);
        course.setVideoUrl("https://evil.example.com/videos/a.mp4");
        course.setSubtitleStatus("none");
        when(courseMapper.selectByIdForUpdate(11L)).thenReturn(course);
        when(asrService.isConfigured()).thenReturn(true);
        when(ossService.signTrustedVideoUrlForAsr("https://evil.example.com/videos/a.mp4"))
                .thenThrow(new BusinessException(400, "视频地址域名不在允许范围内"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminCourseService.triggerSubtitle(11L));

        assertEquals(400, ex.getCode());
        verify(asrService, never()).submit(any());
        verify(courseMapper, never()).update(isNull(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void triggerSubtitle_rejectsWhenOssDisabledForAsr() {
        Course course = new Course();
        course.setId(12L);
        course.setVideoUrl("videos/demo.mp4");
        course.setSubtitleStatus("none");
        when(courseMapper.selectByIdForUpdate(12L)).thenReturn(course);
        when(asrService.isConfigured()).thenReturn(true);
        when(ossService.signTrustedVideoUrlForAsr("videos/demo.mp4"))
                .thenThrow(new BusinessException(503, "ASR 字幕生成要求 OSS 已启用"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminCourseService.triggerSubtitle(12L));

        assertEquals(503, ex.getCode());
        verify(asrService, never()).submit(any());
    }

    @Test
    void update_videoKeyChanged_clearsOldSubtitleAndCancelsAsr() {
        Course existing = processingCourse(20L, "videos/old.mp4", "subtitles/old.vtt", "task-old");
        existing.setName("课程");
        existing.setStatus(0);
        when(courseMapper.selectByIdForUpdate(20L)).thenReturn(existing);
        Course saved = new Course();
        saved.setId(20L);
        saved.setName("课程");
        saved.setVideoUrl("videos/new.mp4");
        saved.setSubtitleStatus("none");
        saved.setStatus(0);
        when(courseMapper.selectById(20L)).thenReturn(saved);
        when(courseResourceMapper.selectList(any())).thenReturn(java.util.List.of());
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());
        CourseSaveRequest req = new CourseSaveRequest();
        req.setName("课程");
        req.setVideoUrl("videos/new.mp4");
        // 编辑弹窗可能回传旧字幕；它不能被误认为新视频配套字幕。
        req.setSubtitleUrl("https://cdn.example.com/subtitles/old.vtt");

        adminCourseService.update(20L, req);

        ArgumentCaptor<LambdaUpdateWrapper<Course>> cap = updateCaptor();
        verify(courseMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "subtitle_url", null);
        assertSetsColumn(cap.getValue(), "subtitle_status", "none");
        assertSetsColumn(cap.getValue(), "subtitle_task_id", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_started_at", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_poll_at", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_attempt_count", 0);
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_error", null);
        verify(ossMediaCleanupService).afterReplace("subtitles/old.vtt", null);
    }

    @Test
    void update_sameManagedVideoKey_keepsSubtitleState() {
        Course existing = processingCourse(21L, "videos/same.mp4", "subtitles/old.vtt", "task-live");
        existing.setName("课程");
        existing.setStatus(0);
        when(courseMapper.selectByIdForUpdate(21L)).thenReturn(existing);
        when(courseMapper.selectById(21L)).thenReturn(existing);
        when(courseResourceMapper.selectList(any())).thenReturn(java.util.List.of());
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());
        CourseSaveRequest req = new CourseSaveRequest();
        req.setName("改标题");
        req.setVideoUrl("https://cdn.example.com/videos/same.mp4?Expires=1");

        adminCourseService.update(21L, req);

        verify(courseMapper, never()).update(isNull(), any(LambdaUpdateWrapper.class));
        assertEquals("processing", existing.getSubtitleStatus());
        assertEquals("task-live", existing.getSubtitleTaskId());
    }

    @Test
    void updateSubtitle_marksReadyAndClearsPreviousTaskState() {
        Course existing = processingCourse(22L, "videos/a.mp4", "subtitles/old.vtt", "task-live");
        when(courseMapper.selectByIdForUpdate(22L)).thenReturn(existing);
        Course saved = new Course();
        saved.setId(22L);
        saved.setSubtitleUrl("subtitles/manual.vtt");
        saved.setSubtitleStatus("ready");
        when(courseMapper.selectById(22L)).thenReturn(saved);
        SubtitleUpdateRequest req = new SubtitleUpdateRequest();
        req.setSubtitleUrl("subtitles/manual.vtt");

        adminCourseService.updateSubtitle(22L, req);

        ArgumentCaptor<LambdaUpdateWrapper<Course>> cap = updateCaptor();
        verify(courseMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "subtitle_url", "subtitles/manual.vtt");
        assertSetsColumn(cap.getValue(), "subtitle_status", "ready");
        assertSetsColumn(cap.getValue(), "subtitle_task_id", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_started_at", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_poll_at", null);
        assertSetsColumn(cap.getValue(), "subtitle_asr_attempt_count", 0);
        assertSetsColumn(cap.getValue(), "subtitle_asr_last_error", null);
        verify(ossMediaCleanupService).afterReplace("subtitles/old.vtt", "subtitles/manual.vtt");
    }

    private static Course processingCourse(Long id, String video, String subtitle, String taskId) {
        Course course = new Course();
        course.setId(id);
        course.setVideoUrl(video);
        course.setSubtitleUrl(subtitle);
        course.setSubtitleStatus("processing");
        course.setSubtitleTaskId(taskId);
        course.setSubtitleAsrStartedAt(java.time.LocalDateTime.now());
        course.setSubtitleAsrLastPollAt(java.time.LocalDateTime.now());
        course.setSubtitleAsrAttemptCount(2);
        course.setSubtitleAsrLastError("old error");
        return course;
    }
}
