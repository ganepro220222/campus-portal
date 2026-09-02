package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
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

    /**
     * 解析名称分类筛选。未传筛选与无效筛选是两种不同结果，调用方可据此安全地
     * 放开查询或直接返回空结果。
     */
    public CategoryFilter resolveFilter(String type, String rawName) {
        if (isUnfilteredValue(rawName)) {
            return CategoryFilter.unfiltered();
        }

        String name = rawName.trim();
        Category category = findActiveByName(type, name);
        if (!isActiveCategoryOfType(category, type)
                || !Objects.equals(category.getName(), name)) {
            return CategoryFilter.invalid();
        }
        return CategoryFilter.matched(category.getId());
    }

    /**
     * ID 大于 0 时优先按 ID 解析，不再回退到名称；这可防止非法 ID 意外放开查询。
     */
    public CategoryFilter resolveFilter(String type, Long categoryId, String rawName) {
        if (categoryId == null || categoryId <= 0) {
            return resolveFilter(type, rawName);
        }

        Category category = categoryMapper.selectById(categoryId);
        if (!isActiveCategoryOfType(category, type)) {
            return CategoryFilter.invalid();
        }
        return CategoryFilter.matched(categoryId);
    }

    private Category findActiveByName(String type, String name) {
        return categoryMapper.selectOne(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type)
                .eq(Category::getName, name)
                .eq(Category::getStatus, 1)
                .last("LIMIT 1"));
    }

    private static boolean isActiveCategoryOfType(Category category, String type) {
        return category != null
                && Objects.equals(category.getType(), type)
                && Integer.valueOf(1).equals(category.getStatus());
    }

    private static boolean isUnfilteredValue(String rawName) {
        if (rawName == null) {
            return true;
        }
        String value = rawName.trim();
        return value.isEmpty()
                || "全部".equals(value)
                || "undefined".equalsIgnoreCase(value)
                || "null".equalsIgnoreCase(value);
    }

    public record CategoryFilter(Status status, Long categoryId) {

        public enum Status {
            UNFILTERED,
            MATCHED,
            INVALID
        }

        public static CategoryFilter unfiltered() {
            return new CategoryFilter(Status.UNFILTERED, null);
        }

        public static CategoryFilter matched(Long categoryId) {
            return new CategoryFilter(Status.MATCHED, categoryId);
        }

        public static CategoryFilter invalid() {
            return new CategoryFilter(Status.INVALID, null);
        }

        public boolean shouldFilter() {
            return status == Status.MATCHED;
        }

        public boolean isInvalid() {
            return status == Status.INVALID;
        }
    }
}
