package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseResourceMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseMapper courseMapper;
    @Mock
    private CourseResourceMapper courseResourceMapper;
    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private OssService ossService;

    @InjectMocks
    private CourseService courseService;

    private static final Long COURSE_ID = 8L;
    private static final Long MEMBER_ID = 3L;

    @BeforeEach
    void setUp() {
        MemberContext.setMemberId(MEMBER_ID);
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    @Test
    void detail_doesNotExposeVideoOrSubtitleUrls() {
        Course course = publishedCourse();
        when(courseMapper.selectById(COURSE_ID)).thenReturn(course);
        when(categoryService.nameMap("course")).thenReturn(Map.of());
        when(categoryService.getName(any(), any())).thenReturn("文化");
        when(courseResourceMapper.selectList(any())).thenReturn(java.util.List.of());
        when(ossService.signUrl("cover.jpg")).thenReturn("https://cdn/cover.jpg");

        Map<String, Object> result = courseService.detail(COURSE_ID);

        assertEquals(true, result.get("hasVideo"));
        assertEquals(true, result.get("hasSubtitle"));
        assertFalse(result.containsKey("videoUrl"));
        assertFalse(result.containsKey("subtitleUrl"));
        verify(ossService, never()).signMediaUrl(anyString());
    }

    @Test
    void play_requiresLogin() {
        MemberContext.clear();

        BusinessException ex = assertThrows(BusinessException.class, () -> courseService.play(COURSE_ID));
        assertEquals(401, ex.getCode());
    }

    @Test
    void play_returnsShortLivedMediaUrls() {
        Course course = publishedCourse();
        when(courseMapper.selectById(COURSE_ID)).thenReturn(course);
        when(ossService.signMediaUrl("videos/a.mp4")).thenReturn("https://cdn/videos/a.mp4?sig=1");
        when(ossService.signMediaUrl("subtitles/a.vtt")).thenReturn("https://cdn/subtitles/a.vtt?sig=2");

        Map<String, Object> result = courseService.play(COURSE_ID);

        assertEquals("https://cdn/videos/a.mp4?sig=1", result.get("videoUrl"));
        assertEquals("https://cdn/subtitles/a.vtt?sig=2", result.get("subtitleUrl"));
        verify(eventLogService).record("play", "course", COURSE_ID);
        verify(ossService, never()).signUrl(anyString());
    }

    private Course publishedCourse() {
        Course course = new Course();
        course.setId(COURSE_ID);
        course.setStatus(1);
        course.setName("测试课");
        course.setCover("cover.jpg");
        course.setVideoUrl("videos/a.mp4");
        course.setSubtitleUrl("subtitles/a.vtt");
        course.setSubtitleStatus("ready");
        return course;
    }
}
