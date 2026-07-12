package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BannerLinkPolicyTest {

    @Mock
    private NewsMapper newsMapper;
    @Mock
    private CourseMapper courseMapper;
    @Mock
    private HallMapper hallMapper;
    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private CraftMapper craftMapper;

    @InjectMocks
    private BannerLinkPolicy bannerLinkPolicy;

    @Test
    void validate_acceptsFixedHome() {
        bannerLinkPolicy.validate("fixed", "home");
    }

    @Test
    void validate_rejectsUnpublishedNews() {
        News news = new News();
        news.setId(1L);
        news.setStatus("draft");
        when(newsMapper.selectById(1L)).thenReturn(news);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> bannerLinkPolicy.validate("news", "1"));
        assertEquals("请选择已发布的新闻", ex.getMessage());
    }

    @Test
    void resolveLabel_formatsNewsTitle() {
        News news = new News();
        news.setId(2L);
        news.setTitle("阳明文化讲座");
        news.setStatus("published");
        when(newsMapper.selectById(2L)).thenReturn(news);

        assertEquals("新闻详情：阳明文化讲座", bannerLinkPolicy.resolveLabel("news", "2"));
    }
}
