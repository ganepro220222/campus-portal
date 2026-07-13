package com.shuyuan.backend.service;

import com.shuyuan.backend.asr.AsrJobResult;
import com.shuyuan.backend.asr.AsrJobState;
import com.shuyuan.backend.asr.AsrProvider;
import com.shuyuan.backend.asr.DisabledAsrProvider;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCourseServiceSubtitleTest {

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
        verify(courseMapper, never()).updateById(any(Course.class));
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

        verify(courseMapper).updateById(org.mockito.ArgumentMatchers.argThat((Course u) ->
                "processing".equals(u.getSubtitleStatus())
                        && "task-abc".equals(u.getSubtitleTaskId())
                        && u.getSubtitleAsrStartedAt() != null
                        && Integer.valueOf(0).equals(u.getSubtitleAsrAttemptCount())));
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
        verify(courseMapper, never()).updateById(any(Course.class));
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
