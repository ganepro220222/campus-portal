package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NewsServiceTest {

    @Mock
    private NewsMapper newsMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;
    @Mock
    private ViewCountService viewCountService;

    @InjectMocks
    private NewsService newsService;

    @BeforeEach
    @AfterEach
    void clearMemberContext() {
        MemberContext.clear();
    }

    @Test
    void detail_usesRedisViewCountInsteadOfDirectDbUpdate() {
        News news = new News();
        news.setId(3L);
        news.setTitle("测试资讯");
        news.setStatus("published");
        news.setViewCount(10);
        news.setPublishTime(LocalDateTime.now());
        news.setContent("正文");

        when(newsMapper.selectById(3L)).thenReturn(news);
        when(viewCountService.getDisplayCount("news", 3L, 10)).thenReturn(11);

        Map<String, Object> result = newsService.detail(3L, "127.0.0.1");

        verify(viewCountService).recordView("news", 3L, null, "127.0.0.1");
        verify(newsMapper, org.mockito.Mockito.never()).updateById(news);
        assertEquals(11, result.get("viewCount"));
        assertEquals(11, result.get("readCount"));
    }

    @Test
    void detail_throwsWhenNotPublished() {
        News news = new News();
        news.setId(4L);
        news.setStatus("draft");
        when(newsMapper.selectById(4L)).thenReturn(news);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> newsService.detail(4L, "127.0.0.1"));
        assertEquals(404, ex.getCode());
    }
}
