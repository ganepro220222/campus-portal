package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CourseSaveRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseResourceMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

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
    @Mock
    private AsrService asrService;
    @Mock
    private OssService ossService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

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

    @Test
    void create_ignoresRequestedOnlineStatus() {
        CourseSaveRequest req = new CourseSaveRequest();
        req.setName("待审核课程");
        req.setStatus(1);
        doAnswer(invocation -> {
            Course inserted = invocation.getArgument(0);
            inserted.setId(20L);
            return 1;
        }).when(courseMapper).insert(any(Course.class));
        Course saved = new Course();
        saved.setId(20L);
        saved.setName("待审核课程");
        saved.setStatus(0);
        saved.setSubtitleStatus("none");
        when(courseMapper.selectById(20L)).thenReturn(saved);
        when(courseResourceMapper.selectList(any())).thenReturn(List.of());
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());

        adminCourseService.create(req);

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseMapper).insert(captor.capture());
        assertEquals(0, captor.getValue().getStatus());
        verify(searchIndexSyncService, never()).syncCourse(any());
    }

    @Test
    void update_ignoresRequestedOnlineStatus() {
        Course existing = new Course();
        existing.setId(21L);
        existing.setName("待审核课程");
        existing.setStatus(0);
        existing.setSubtitleStatus("none");
        when(courseMapper.selectByIdForUpdate(21L)).thenReturn(existing);
        when(courseMapper.selectById(21L)).thenReturn(existing);
        when(courseResourceMapper.selectList(any())).thenReturn(List.of());
        when(categoryService.nameMap("course")).thenReturn(java.util.Map.of());
        CourseSaveRequest req = new CourseSaveRequest();
        req.setName("仅改标题");
        req.setStatus(1);

        adminCourseService.update(21L, req);

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseMapper).updateById(captor.capture());
        assertEquals(0, captor.getValue().getStatus());
        verify(searchIndexSyncService, never()).syncCourse(any());
    }
}
