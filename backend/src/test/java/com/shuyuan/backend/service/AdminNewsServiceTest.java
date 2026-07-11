package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminNewsServiceTest {

    @Mock
    private NewsMapper newsMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;

    @InjectMocks
    private AdminNewsService adminNewsService;

    @Test
    void delete_removesDraftAndSearchIndex() {
        News draft = new News();
        draft.setId(5L);
        draft.setStatus("draft");
        draft.setTitle("测试草稿");
        when(newsMapper.selectById(5L)).thenReturn(draft);

        adminNewsService.delete(5L);

        verify(newsMapper).deleteById(5L);
        verify(searchIndexSyncService).removeNews(5L);
    }

    @Test
    void delete_rejectsPublishedNews() {
        News published = new News();
        published.setId(6L);
        published.setStatus("published");
        when(newsMapper.selectById(6L)).thenReturn(published);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminNewsService.delete(6L));

        assertEquals(400, ex.getCode());
        verify(newsMapper, never()).deleteById(anyLong());
        verify(searchIndexSyncService, never()).removeNews(anyLong());
    }
}
