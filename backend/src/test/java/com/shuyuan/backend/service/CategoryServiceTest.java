package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.mapper.CategoryMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryMapper categoryMapper;

    @Test
    void resolveFilter_treatsAllAndWxSentinelsAsUnfiltered() {
        CategoryService service = new CategoryService(categoryMapper);

        for (String value : new String[]{null, "", "  ", "全部", "undefined", "NULL"}) {
            CategoryService.CategoryFilter filter = service.resolveFilter("hall", value);
            assertEquals(CategoryService.CategoryFilter.Status.UNFILTERED, filter.status());
        }
        verify(categoryMapper, never()).selectOne(any(LambdaQueryWrapper.class));
    }

    @Test
    void resolveFilter_matchesActiveCategoryByTrimmedName() {
        CategoryService service = new CategoryService(categoryMapper);
        Category category = category(8L, "course", "安全教育", 1);
        when(categoryMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(category);

        CategoryService.CategoryFilter filter = service.resolveFilter("course", " 安全教育 ");

        assertTrue(filter.shouldFilter());
        assertEquals(8L, filter.categoryId());
    }

    @Test
    void resolveFilter_failsClosedForMissingOrInactiveName() {
        CategoryService service = new CategoryService(categoryMapper);
        when(categoryMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(null)
                .thenReturn(category(8L, "course", "安全教育", 0));

        assertTrue(service.resolveFilter("course", "已删除").isInvalid());
        assertTrue(service.resolveFilter("course", "安全教育").isInvalid());
    }

    @Test
    void resolveFilter_idTakesPriorityAndValidatesTypeAndStatus() {
        CategoryService service = new CategoryService(categoryMapper);
        when(categoryMapper.selectById(9L)).thenReturn(category(9L, "news", "动态", 1));
        when(categoryMapper.selectById(10L)).thenReturn(category(10L, "course", "停用课程", 0));
        when(categoryMapper.selectById(11L)).thenReturn(category(11L, "course", "课程", 1));

        assertTrue(service.resolveFilter("course", 9L, "课程").isInvalid());
        assertTrue(service.resolveFilter("course", 10L, "课程").isInvalid());
        CategoryService.CategoryFilter matched = service.resolveFilter("course", 11L, "错误名称");
        assertFalse(matched.isInvalid());
        assertEquals(11L, matched.categoryId());
        verify(categoryMapper, never()).selectOne(any(LambdaQueryWrapper.class));
    }

    private static Category category(Long id, String type, String name, int status) {
        Category category = new Category();
        category.setId(id);
        category.setType(type);
        category.setName(name);
        category.setStatus(status);
        return category;
    }
}
