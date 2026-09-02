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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    void syncAllPublished_resetsThenBatchUpsertsActiveRows() {
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
        when(searchIndexMapper.disableAllEnabled()).thenReturn(2);

        int active = searchIndexSyncService.syncAllPublished();

        assertEquals(1, active);
        ArgumentCaptor<List<SearchIndex>> rows = ArgumentCaptor.forClass(List.class);
        verify(searchIndexMapper).upsertBatch(rows.capture());
        assertEquals(1, rows.getValue().size());
        assertEquals("news", rows.getValue().get(0).getTargetType());
        assertEquals("标题", rows.getValue().get(0).getTitle());
        InOrder order = inOrder(searchIndexMapper);
        order.verify(searchIndexMapper).disableAllEnabled();
        order.verify(searchIndexMapper).upsertBatch(any());
    }

    @Test
    void syncNews_skipsNonPublished() {
        News draft = new News();
        draft.setStatus("draft");
        searchIndexSyncService.syncNews(draft);
        verify(searchIndexMapper, never()).insert(any(SearchIndex.class));
        verify(searchIndexMapper, never()).updateById(any(SearchIndex.class));
    }

    @Test
    void syncAllPublished_splitsLargeUpsertIntoBoundedBatches() {
        List<News> news = new ArrayList<>();
        for (long id = 1; id <= 201; id++) {
            News row = new News();
            row.setId(id);
            row.setTitle("动态 " + id);
            row.setStatus("published");
            news.add(row);
        }
        when(newsMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(news);
        when(hallMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(courseMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(craftMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(resourceMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        assertEquals(201, searchIndexSyncService.syncAllPublished());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SearchIndex>> batches = ArgumentCaptor.forClass(List.class);
        verify(searchIndexMapper, times(2)).upsertBatch(batches.capture());
        assertEquals(List.of(200, 1),
                batches.getAllValues().stream().map(List::size).toList());
    }
}
