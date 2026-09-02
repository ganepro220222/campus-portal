package com.shuyuan.backend.service;

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
}
