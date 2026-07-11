package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseResourceMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCourseServiceTest {

    @Mock
    private CourseMapper courseMapper;
    @Mock
    private CourseResourceMapper courseResourceMapper;
    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;

    @InjectMocks
    private AdminCourseService adminCourseService;

    @Test
    void publish_setsOnlineAndSyncsSearch() {
        Course offline = new Course();
        offline.setId(11L);
        offline.setName("节水教育");
        offline.setStatus(0);
        Course online = new Course();
        online.setId(11L);
        online.setName("节水教育");
        online.setStatus(1);
        when(courseMapper.selectById(11L)).thenReturn(offline, online, online);
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());
        when(courseResourceMapper.selectList(any())).thenReturn(List.of());

        adminCourseService.publish(11L);

        verify(searchIndexSyncService).syncCourse(online);
    }

    @Test
    void unpublish_removesSearchIndex() {
        Course online = new Course();
        online.setId(12L);
        online.setName("交通安全");
        online.setStatus(1);
        Course offline = new Course();
        offline.setId(12L);
        offline.setName("交通安全");
        offline.setStatus(0);
        when(courseMapper.selectById(12L)).thenReturn(online, offline, offline);
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());
        when(courseResourceMapper.selectList(any())).thenReturn(List.of());

        adminCourseService.unpublish(12L);

        verify(searchIndexSyncService).removeCourse(12L);
    }

    @Test
    void publish_rejectsAlreadyOnline() {
        Course online = new Course();
        online.setId(13L);
        online.setStatus(1);
        when(courseMapper.selectById(13L)).thenReturn(online);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminCourseService.publish(13L));

        assertEquals(400, ex.getCode());
        verify(searchIndexSyncService, never()).syncCourse(any());
    }
}
