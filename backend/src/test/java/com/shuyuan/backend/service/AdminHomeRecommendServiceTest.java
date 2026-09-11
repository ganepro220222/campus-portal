package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HomeRecommendSaveRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HomeRecommend;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HomeRecommendMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminHomeRecommendServiceTest {

    @Mock private HomeRecommendMapper homeRecommendMapper;
    @Mock private NewsMapper newsMapper;
    @Mock private HallMapper hallMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminHomeRecommendService service;

    @BeforeEach
    void setUp() {
        doNothing().when(adminPermissionService).require("admin:super");
    }

    @Test
    void listGrouped_marksUnpublishedAndMissing() {
        HomeRecommend liveNews = slot(1L, "news", 11L, 1, 1);
        HomeRecommend draftNews = slot(2L, "news", 12L, 2, 1);
        HomeRecommend goneNews = slot(3L, "news", 13L, 3, 1);
        HomeRecommend hall = slot(4L, "hall", 21L, 1, 1);
        HomeRecommend course = slot(5L, "course", 31L, 1, 0);
        when(homeRecommendMapper.selectList(any())).thenReturn(
                List.of(liveNews, draftNews, goneNews, hall, course));

        News published = new News();
        published.setTitle("已发动态");
        published.setStatus("published");
        News draft = new News();
        draft.setTitle("草稿动态");
        draft.setStatus("draft");
        when(newsMapper.selectById(11L)).thenReturn(published);
        when(newsMapper.selectById(12L)).thenReturn(draft);
        when(newsMapper.selectById(13L)).thenReturn(null);

        Hall online = new Hall();
        online.setName("校史馆");
        online.setStatus(1);
        when(hallMapper.selectById(21L)).thenReturn(online);

        Course offline = new Course();
        offline.setName("沟通");
        offline.setStatus(0);
        when(courseMapper.selectById(31L)).thenReturn(offline);

        Map<String, Object> result = service.listGrouped();
        List<?> news = (List<?>) result.get("news");
        List<?> halls = (List<?>) result.get("halls");
        List<?> courses = (List<?>) result.get("courses");

        assertEquals(3, news.size());
        assertEquals(1, halls.size());
        assertEquals(1, courses.size());

        Map<?, ?> live = (Map<?, ?>) news.get(0);
        assertEquals("已发动态", live.get("title"));
        assertEquals(true, live.get("targetPublished"));
        assertEquals(false, live.get("targetMissing"));

        Map<?, ?> draftVo = (Map<?, ?>) news.get(1);
        assertEquals("草稿动态", draftVo.get("title"));
        assertEquals(false, draftVo.get("targetPublished"));
        assertEquals(false, draftVo.get("targetMissing"));

        Map<?, ?> gone = (Map<?, ?>) news.get(2);
        assertEquals("", gone.get("title"));
        assertEquals(true, gone.get("targetMissing"));
        assertEquals(false, gone.get("targetPublished"));

        Map<?, ?> hallVo = (Map<?, ?>) halls.get(0);
        assertEquals("校史馆", hallVo.get("title"));
        assertEquals(true, hallVo.get("targetPublished"));

        Map<?, ?> courseVo = (Map<?, ?>) courses.get(0);
        assertEquals("沟通", courseVo.get("title"));
        assertEquals(false, courseVo.get("targetPublished"));
        assertEquals(0, courseVo.get("status"));
    }

    @Test
    void create_rejectsUnpublishedNews() {
        News draft = new News();
        draft.setStatus("draft");
        when(newsMapper.selectById(8L)).thenReturn(draft);

        HomeRecommendSaveRequest req = new HomeRecommendSaveRequest();
        req.setModuleType("news");
        req.setTargetId(8L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(req));
        assertEquals(400, ex.getCode());
        assertEquals("请选择已发布或已上架的动态", ex.getMessage());
        verify(homeRecommendMapper, never()).insert(any(HomeRecommend.class));
    }

    @Test
    void create_rejectsDuplicate() {
        News published = new News();
        published.setStatus("published");
        published.setTitle("重复");
        when(newsMapper.selectById(8L)).thenReturn(published);
        when(homeRecommendMapper.selectCount(any())).thenReturn(1L);

        HomeRecommendSaveRequest req = new HomeRecommendSaveRequest();
        req.setModuleType("news");
        req.setTargetId(8L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(req));
        assertEquals("该内容已在首页推荐中", ex.getMessage());
        verify(homeRecommendMapper, never()).insert(any(HomeRecommend.class));
    }

    @Test
    void create_rejectsUnknownModule() {
        HomeRecommendSaveRequest req = new HomeRecommendSaveRequest();
        req.setModuleType("craft");
        req.setTargetId(1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(req));
        assertEquals("板块只能是动态、展馆或课程", ex.getMessage());
    }

    @Test
    void create_insertsPublishedCourse() {
        Course course = new Course();
        course.setName("平台入门");
        course.setStatus(1);
        when(courseMapper.selectById(9L)).thenReturn(course);
        when(homeRecommendMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            HomeRecommend row = invocation.getArgument(0);
            row.setId(40L);
            return 1;
        }).when(homeRecommendMapper).insert(any(HomeRecommend.class));
        HomeRecommend saved = slot(40L, "course", 9L, 3, 1);
        when(homeRecommendMapper.selectById(40L)).thenReturn(saved);

        HomeRecommendSaveRequest req = new HomeRecommendSaveRequest();
        req.setModuleType("course");
        req.setTargetId(9L);
        req.setSort(3);
        req.setStatus(1);

        Map<String, Object> vo = service.create(req);
        assertEquals(40L, vo.get("id"));
        assertEquals("平台入门", vo.get("title"));
        assertTrue((Boolean) vo.get("targetPublished"));
        assertFalse((Boolean) vo.get("targetMissing"));
    }

    @Test
    void update_onlyChangesSortAndStatus() {
        HomeRecommend existing = slot(7L, "news", 11L, 1, 1);
        when(homeRecommendMapper.selectById(7L)).thenReturn(existing);
        News published = new News();
        published.setTitle("已发动态");
        published.setStatus("published");
        when(newsMapper.selectById(11L)).thenReturn(published);

        HomeRecommendSaveRequest req = new HomeRecommendSaveRequest();
        req.setModuleType("hall");
        req.setTargetId(99L);
        req.setSort(8);
        req.setStatus(0);

        Map<String, Object> vo = service.update(7L, req);
        assertEquals(8, existing.getSort());
        assertEquals(0, existing.getStatus());
        assertEquals("news", existing.getModuleType());
        assertEquals(11L, existing.getTargetId());
        assertEquals("news", vo.get("moduleType"));
        assertEquals(11L, vo.get("targetId"));
        verify(homeRecommendMapper).updateById(existing);
    }

    @Test
    void delete_missingRow_throws404() {
        when(homeRecommendMapper.selectById(5L)).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.delete(5L));
        assertEquals(404, ex.getCode());
        verify(homeRecommendMapper, never()).deleteById(5L);
    }

    private static HomeRecommend slot(Long id, String type, Long targetId, int sort, int status) {
        HomeRecommend row = new HomeRecommend();
        row.setId(id);
        row.setModuleType(type);
        row.setTargetId(targetId);
        row.setSort(sort);
        row.setStatus(status);
        return row;
    }
}
