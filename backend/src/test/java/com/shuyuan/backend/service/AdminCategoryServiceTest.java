package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CategorySaveRequest;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.mapper.CategoryMapper;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCategoryServiceTest {

    @Mock
    private CategoryMapper categoryMapper;
    @Mock
    private NewsMapper newsMapper;
    @Mock
    private HallMapper hallMapper;
    @Mock
    private CraftMapper craftMapper;
    @Mock
    private CourseMapper courseMapper;
    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminCategoryService adminCategoryService;

    @Test
    void create_insertsCategory() {
        CategorySaveRequest req = new CategorySaveRequest();
        req.setType("news");
        req.setName("书院动态");
        req.setSort(1);
        req.setStatus(1);

        when(categoryMapper.selectCount(any())).thenReturn(0L);
        doAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(9L);
            return 1;
        }).when(categoryMapper).insert(any(Category.class));

        Category saved = new Category();
        saved.setId(9L);
        saved.setType("news");
        saved.setName("书院动态");
        saved.setSort(1);
        saved.setStatus(1);
        when(categoryMapper.selectById(9L)).thenReturn(saved);

        var vo = adminCategoryService.create(req);

        assertEquals("书院动态", vo.get("name"));
        verify(categoryMapper).insert(any(Category.class));
    }

    @Test
    void delete_blocksWhenReferenced() {
        Category category = new Category();
        category.setId(3L);
        category.setType("news");
        category.setName("文化传承");
        when(categoryMapper.selectById(3L)).thenReturn(category);
        when(newsMapper.selectCount(any())).thenReturn(2L);
        when(hallMapper.selectCount(any())).thenReturn(0L);
        when(craftMapper.selectCount(any())).thenReturn(0L);
        when(courseMapper.selectCount(any())).thenReturn(0L);
        when(resourceMapper.selectCount(any())).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminCategoryService.delete(3L));
        assertEquals(400, ex.getCode());
        verify(categoryMapper, never()).deleteById(3L);
    }

    @Test
    void list_returnsSortedCategories() {
        Category c1 = new Category();
        c1.setId(1L);
        c1.setType("hall");
        c1.setName("博物馆与校史");
        c1.setSort(1);
        c1.setStatus(1);
        when(categoryMapper.selectList(any())).thenReturn(List.of(c1));

        var list = adminCategoryService.list("hall");

        assertEquals(1, list.size());
        assertEquals("博物馆与校史", list.get(0).get("name"));
    }
}
