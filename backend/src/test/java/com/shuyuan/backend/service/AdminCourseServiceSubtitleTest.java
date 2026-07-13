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
        when(ossService.signUrl("videos/demo.mp4")).thenReturn("https://cdn.example.com/videos/demo.mp4");
        when(asrService.submit("https://cdn.example.com/videos/demo.mp4")).thenReturn("task-abc");

        adminCourseService.triggerSubtitle(10L);

        verify(courseMapper).updateById(org.mockito.ArgumentMatchers.argThat((Course u) ->
                "processing".equals(u.getSubtitleStatus())
                        && "task-abc".equals(u.getSubtitleTaskId())));
    }
}
