package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

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
        String saved = captor.getValue().getContent();
        assertTrue(saved.contains("ok"));
        assertFalse(saved.toLowerCase().contains("script"));
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
    void list_omitsRichTextContent() {
        News row = new News();
        row.setId(3L);
        row.setTitle("标题");
        row.setContent("<p>很长正文不应出现在列表里</p>");
        Page<News> page = new Page<>(1, 20);
        page.setRecords(List.of(row));
        page.setTotal(1);
        when(newsMapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(page);
        when(categoryService.nameMap("news")).thenReturn(Map.of());

        var result = adminNewsService.list(null, null, 1, 20);

        assertEquals(1, result.getRecords().size());
        assertEquals("标题", result.getRecords().get(0).get("title"));
        assertFalse(result.getRecords().get(0).containsKey("content"));
    }

    @Test
    void detail_returnsRichTextContent() {
        News row = new News();
        row.setId(3L);
        row.setTitle("标题");
        row.setContent("<p>正文</p>");
        when(newsMapper.selectById(3L)).thenReturn(row);
        when(categoryService.nameMap("news")).thenReturn(Map.of());

        Map<String, Object> vo = adminNewsService.detail(3L);

        assertEquals("<p>正文</p>", vo.get("content"));
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
