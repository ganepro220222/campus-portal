package com.shuyuan.backend.service;

import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.asr.AsrProvider;
import com.shuyuan.backend.asr.DisabledAsrProvider;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
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
        when(courseMapper.selectById(9L)).thenReturn(course);
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
        when(courseMapper.selectById(10L)).thenReturn(course, course);
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
        when(courseMapper.selectById(11L)).thenReturn(course);
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
        when(courseMapper.selectById(12L)).thenReturn(course);
        when(asrService.isConfigured()).thenReturn(true);
        when(ossService.signTrustedVideoUrlForAsr("videos/demo.mp4"))
                .thenThrow(new BusinessException(503, "ASR 字幕生成要求 OSS 已启用"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminCourseService.triggerSubtitle(12L));

        assertEquals(503, ex.getCode());
        verify(asrService, never()).submit(any());
    }
}
