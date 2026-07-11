package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.entity.SearchIndex;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.mapper.SearchIndexMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchIndexSyncServiceTest {

    @Mock
    private SearchIndexMapper searchIndexMapper;
    @Mock
    private NewsMapper newsMapper;
    @Mock
    private HallMapper hallMapper;
    @Mock
    private CourseMapper courseMapper;
    @Mock
    private CraftMapper craftMapper;
    @Mock
    private ResourceMapper resourceMapper;

    @InjectMocks
    private SearchIndexSyncService searchIndexSyncService;

    @Test
    void syncAllPublished_upsertsActiveAndDisablesStale() {
        News news = new News();
        news.setId(1L);
        news.setTitle("标题");
        news.setSummary("摘要");
        news.setStatus("published");
        news.setPublishTime(LocalDateTime.now());

        when(newsMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(news));
        when(hallMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(courseMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(craftMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(resourceMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(searchIndexMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        SearchIndex stale = new SearchIndex();
        stale.setId(99L);
        stale.setTargetType("hall");
        stale.setTargetId(7L);
        stale.setStatus(1);
        when(searchIndexMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(stale));

        int active = searchIndexSyncService.syncAllPublished();

        assertEquals(1, active);
        verify(searchIndexMapper).insert(any(SearchIndex.class));
        verify(searchIndexMapper).updateById(stale);
        assertEquals(0, stale.getStatus());
    }

    @Test
    void syncNews_skipsNonPublished() {
        News draft = new News();
        draft.setStatus("draft");
        searchIndexSyncService.syncNews(draft);
        verify(searchIndexMapper, never()).insert(any(SearchIndex.class));
        verify(searchIndexMapper, never()).updateById(any(SearchIndex.class));
    }
}
