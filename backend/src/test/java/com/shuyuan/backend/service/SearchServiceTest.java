package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SearchIndex;
import com.shuyuan.backend.mapper.SearchIndexMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private SearchIndexMapper searchIndexMapper;

    @InjectMocks
    private SearchService searchService;

    @Test
    void search_clampsOversizedPageSize() {
        Page<SearchIndex> page = new Page<>(1, SearchService.MAX_PAGE_SIZE);
        page.setRecords(List.of());
        page.setTotal(0);
        when(searchIndexMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        var result = searchService.search("阳明", null, 1, 100_000);

        assertEquals(SearchService.MAX_PAGE_SIZE, result.getSize());
        ArgumentCaptor<Page<SearchIndex>> captor = ArgumentCaptor.forClass(Page.class);
        verify(searchIndexMapper).selectPage(captor.capture(), any(LambdaQueryWrapper.class));
        assertEquals(SearchService.MAX_PAGE_SIZE, captor.getValue().getSize());
    }

    @Test
    void search_rejectsOverlongKeyword() {
        String longQ = "a".repeat(SearchService.MAX_KEYWORD_LENGTH + 1);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> searchService.search(longQ, null, 1, 10));
        assertEquals(400, ex.getCode());
    }

    @Test
    void search_returnsEmptyForBlankKeyword() {
        var result = searchService.search("   ", null, 0, 0);
        assertTrue(result.getRecords().isEmpty());
        assertEquals(1, result.getPage());
        assertEquals(10, result.getSize());
    }

    @Test
    void search_returnsEmptyForWildcardOnlyKeyword() {
        var result = searchService.search("%%%", null, 1, 20);
        assertTrue(result.getRecords().isEmpty());
        verify(searchIndexMapper, never()).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
    }

    @Test
    void toLikePattern_escapesPercentAndUnderscore() {
        assertEquals("%a\\%b\\_c%", SearchService.toLikePattern("a%b_c"));
    }
}
