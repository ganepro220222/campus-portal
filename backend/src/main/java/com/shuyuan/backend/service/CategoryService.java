package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryMapper categoryMapper;

    public List<Category> listByType(String type) {
        return categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type)
                .eq(Category::getStatus, 1)
                .orderByAsc(Category::getSort));
    }

    public Map<Long, String> nameMap(String type) {
        return listByType(type).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
    }

    public String getName(Long categoryId, Map<Long, String> cache) {
        if (categoryId == null) {
            return "";
        }
        return cache.getOrDefault(categoryId, "");
    }

    public Long findIdByName(String type, String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        Category cat = categoryMapper.selectOne(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type)
                .eq(Category::getName, name)
                .eq(Category::getStatus, 1)
                .last("LIMIT 1"));
        return cat == null ? null : cat.getId();
    }
}
