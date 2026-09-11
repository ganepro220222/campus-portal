package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HomeRecommend;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HomeRecommendMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomeServiceTest {

    @Mock private HomeRecommendMapper homeRecommendMapper;
    @Mock private NewsMapper newsMapper;
    @Mock private HallMapper hallMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private CategoryService categoryService;

    @InjectMocks
    private HomeService homeService;

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        UpdateWrapperAssertions.initEntityCache(HomeRecommend.class);
    }

    @Test
    void recommends_ordersBySortThenId() {
        when(homeRecommendMapper.selectList(any())).thenReturn(List.of());
        when(categoryService.nameMap(anyString())).thenReturn(Map.of());

        homeService.recommends();

        ArgumentCaptor<LambdaQueryWrapper<HomeRecommend>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(homeRecommendMapper).selectList(captor.capture());
        String sql = captor.getValue().getSqlSegment();
        assertTrue(sql.contains("sort") && sql.contains("id"),
                "相同 sort 必须再按 id 排，否则公开首页与后台顺序可能不一致。实际：" + sql);
        int sortAt = sql.indexOf("sort");
        int idAt = sql.lastIndexOf("id");
        assertTrue(sortAt >= 0 && idAt > sortAt, "sort 必须在 id 前面：" + sql);
    }

    @Test
    void recommends_skipsDraftOfflineAndMissing() {
        when(homeRecommendMapper.selectList(any())).thenReturn(List.of(
                rec("news", 1L),
                rec("news", 2L),
                rec("news", 3L),
                rec("hall", 4L),
                rec("hall", 5L),
                rec("course", 6L),
                rec("course", 7L),
                rec("course", 8L)));
        when(categoryService.nameMap(anyString())).thenReturn(Map.of());

        News live = new News();
        live.setId(1L);
        live.setStatus("published");
        live.setTitle("已发动态");
        News draft = new News();
        draft.setId(2L);
        draft.setStatus("draft");
        draft.setTitle("草稿动态");
        when(newsMapper.selectById(1L)).thenReturn(live);
        when(newsMapper.selectById(2L)).thenReturn(draft);
        when(newsMapper.selectById(3L)).thenReturn(null);

        Hall offline = new Hall();
        offline.setId(4L);
        offline.setName("下架展馆");
        offline.setStatus(0);
        Hall online = new Hall();
        online.setId(5L);
        online.setName("上架展馆");
        online.setStatus(1);
        when(hallMapper.selectById(4L)).thenReturn(offline);
        when(hallMapper.selectById(5L)).thenReturn(online);

        Course courseOffline = new Course();
        courseOffline.setId(6L);
        courseOffline.setName("下架课程");
        courseOffline.setStatus(0);
        Course courseOnline = new Course();
        courseOnline.setId(8L);
        courseOnline.setName("上架课程");
        courseOnline.setStatus(1);
        courseOnline.setCategoryId(3L);
        when(courseMapper.selectById(6L)).thenReturn(courseOffline);
        when(courseMapper.selectById(7L)).thenReturn(null);
        when(courseMapper.selectById(8L)).thenReturn(courseOnline);
        when(categoryService.getName(nullable(Long.class), any())).thenReturn("分类");

        Map<String, Object> result = homeService.recommends();
        List<?> news = assertInstanceOf(List.class, result.get("news"));
        List<?> halls = assertInstanceOf(List.class, result.get("halls"));
        List<?> courses = assertInstanceOf(List.class, result.get("courses"));
        assertEquals(1, news.size());
        assertEquals(1, halls.size());
        assertEquals(1, courses.size());
        assertEquals(1L, assertInstanceOf(Map.class, news.get(0)).get("id"));
        assertEquals(5L, assertInstanceOf(Map.class, halls.get(0)).get("id"));
        assertEquals(8L, assertInstanceOf(Map.class, courses.get(0)).get("id"));
    }

    @Test
    void recommends_formatsNewsPublishTimeLikePublicNewsList() {
        HomeRecommend recommend = new HomeRecommend();
        recommend.setModuleType("news");
        recommend.setTargetId(1L);
        when(homeRecommendMapper.selectList(any())).thenReturn(List.of(recommend));
        when(categoryService.nameMap(anyString())).thenReturn(Map.of());

        News news = new News();
        news.setId(1L);
        news.setStatus("published");
        news.setTitle("测试动态");
        news.setPublishTime(LocalDateTime.of(2026, 9, 1, 10, 30));
        when(newsMapper.selectById(1L)).thenReturn(news);

        Map<String, Object> result = homeService.recommends();

        List<?> items = assertInstanceOf(List.class, result.get("news"));
        Map<?, ?> item = assertInstanceOf(Map.class, items.get(0));
        assertEquals("2026-09-01", item.get("publishTime"));
    }

    @Test
    void recommends_keepsCategoryAndAddsSubtitleTag() {
        HomeRecommend readyRec = new HomeRecommend();
        readyRec.setModuleType("course");
        readyRec.setTargetId(8L);
        HomeRecommend processingRec = new HomeRecommend();
        processingRec.setModuleType("course");
        processingRec.setTargetId(9L);
        when(homeRecommendMapper.selectList(any())).thenReturn(List.of(readyRec, processingRec));
        when(categoryService.nameMap(anyString())).thenReturn(Map.of(3L, "通识必修"));
        when(categoryService.getName(eq(3L), any())).thenReturn("通识必修");

        Course ready = new Course();
        ready.setId(8L);
        ready.setStatus(1);
        ready.setName("沟通");
        ready.setCategoryId(3L);
        ready.setDurationMinutes(90);
        ready.setTargetAudience("全校学生");
        ready.setSubtitleStatus("ready");
        Course processing = new Course();
        processing.setId(9L);
        processing.setStatus(1);
        processing.setName("数字素养");
        processing.setCategoryId(3L);
        processing.setDurationMinutes(45);
        processing.setSubtitleStatus("processing");
        when(courseMapper.selectById(8L)).thenReturn(ready);
        when(courseMapper.selectById(9L)).thenReturn(processing);

        Map<String, Object> result = homeService.recommends();

        List<?> items = assertInstanceOf(List.class, result.get("courses"));
        Map<?, ?> withSub = assertInstanceOf(Map.class, items.get(0));
        Map<?, ?> noSub = assertInstanceOf(Map.class, items.get(1));
        assertEquals(true, withSub.get("hasSubtitle"));
        assertEquals(List.of("通识必修", "字幕"), withSub.get("tags"));
        assertEquals(false, noSub.get("hasSubtitle"));
        assertEquals(List.of("通识必修"), noSub.get("tags"));
    }

    private static HomeRecommend rec(String type, long targetId) {
        HomeRecommend row = new HomeRecommend();
        row.setModuleType(type);
        row.setTargetId(targetId);
        row.setStatus(1);
        return row;
    }
}
