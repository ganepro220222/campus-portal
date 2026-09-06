package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.HomeRecommend;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HomeRecommendMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
}
