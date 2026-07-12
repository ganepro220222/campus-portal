package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.NewsSaveRequest;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
    void create_sanitizesRichTextContent() {
        when(categoryService.nameMap("news")).thenReturn(Map.of());
        doAnswer(inv -> {
            News n = inv.getArgument(0);
            n.setId(1L);
            return 1;
        }).when(newsMapper).insert(any(News.class));
        when(newsMapper.selectById(1L)).thenAnswer(inv -> {
            News n = new News();
            n.setId(1L);
            n.setTitle("标题");
            n.setContent("<p>ok</p>");
            n.setStatus("draft");
            return n;
        });

        NewsSaveRequest req = new NewsSaveRequest();
        req.setTitle("标题");
        req.setContent("<p>ok</p><script>evil()</script>");

        adminNewsService.create(req);

        ArgumentCaptor<News> captor = ArgumentCaptor.forClass(News.class);
        verify(newsMapper).insert(captor.capture());
        assertEquals("<p>ok</p>", captor.getValue().getContent());
        assertFalse(captor.getValue().getContent().contains("script"));
    }

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
