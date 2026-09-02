package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.mapper.CategoryMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryService categoryService;

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "  ", "\t", "全部", " undefined ", "NULL"})
    void resolveFilter_distinguishesUnfilteredSentinelsWithoutQuerying(String rawName) {
        CategoryService.CategoryFilter result = categoryService.resolveFilter("hall", rawName);

        assertEquals(CategoryService.CategoryFilter.Status.UNFILTERED, result.status());
        assertFalse(result.shouldFilter());
        assertFalse(result.isInvalid());
        verifyNoInteractions(categoryMapper);
    }

    @Test
    void resolveFilter_returnsMatchedActiveCategoryName() {
        Category category = category(17L, "hall", "安全教育", 1);
        when(categoryMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(category);

        CategoryService.CategoryFilter result =
                categoryService.resolveFilter("hall", " 安全教育 ");

        assertEquals(CategoryService.CategoryFilter.Status.MATCHED, result.status());
        assertEquals(17L, result.categoryId());
        assertTrue(result.shouldFilter());
    }

    @Test
    void resolveFilter_returnsInvalidForMissingOrInactiveCategoryName() {
        Category inactive = category(17L, "hall", "安全教育", 0);
        when(categoryMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(inactive);

        CategoryService.CategoryFilter result =
                categoryService.resolveFilter("hall", "安全教育");

        assertTrue(result.isInvalid());
    }

    @Test
    void resolveFilter_returnsInvalidForMissingCategoryName() {
        when(categoryMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertTrue(categoryService.resolveFilter("hall", "已删除分类").isInvalid());
    }

    @Test
    void resolveFilter_prefersPositiveIdAndValidatesTypeAndStatus() {
        Category activeNews = category(8L, "news", "通知公告", 1);
        when(categoryMapper.selectById(8L)).thenReturn(activeNews);

        CategoryService.CategoryFilter result =
                categoryService.resolveFilter("news", 8L, "不存在的名称");

        assertEquals(CategoryService.CategoryFilter.Status.MATCHED, result.status());
        assertEquals(8L, result.categoryId());
        verify(categoryMapper, never()).selectOne(any(LambdaQueryWrapper.class));
    }

    @Test
    void resolveFilter_rejectsPositiveIdFromWrongType() {
        when(categoryMapper.selectById(8L))
                .thenReturn(category(8L, "hall", "安全教育", 1));

        CategoryService.CategoryFilter result =
                categoryService.resolveFilter("news", 8L, "全部");

        assertTrue(result.isInvalid());
    }

    @Test
    void resolveFilter_rejectsInactivePositiveId() {
        when(categoryMapper.selectById(8L))
                .thenReturn(category(8L, "news", "通知公告", 0));

        CategoryService.CategoryFilter result =
                categoryService.resolveFilter("news", 8L, null);

        assertTrue(result.isInvalid());
    }

    private static Category category(Long id, String type, String name, Integer status) {
        Category category = new Category();
        category.setId(id);
        category.setType(type);
        category.setName(name);
        category.setStatus(status);
        return category;
    }
}
