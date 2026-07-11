package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CategorySaveRequest;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.CategoryMapper;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    static final Set<String> VALID_TYPES = Set.of("news", "hall", "craft", "course", "resource");

    private final CategoryMapper categoryMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CraftMapper craftMapper;
    private final CourseMapper courseMapper;
    private final ResourceMapper resourceMapper;
    private final AdminPermissionService adminPermissionService;

    public List<Map<String, Object>> list(String type) {
        adminPermissionService.require("category:read");
        validateType(type);
        return categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                        .eq(Category::getType, type)
                        .orderByAsc(Category::getSort)
                        .orderByAsc(Category::getId))
                .stream()
                .map(this::toVo)
                .toList();
    }

    public Map<String, Object> create(CategorySaveRequest req) {
        adminPermissionService.require("category:write");
        validateRequest(req);
        ensureUniqueName(req.getType(), req.getName().trim(), null);
        Category category = fromRequest(new Category(), req);
        if (category.getSort() == null) {
            category.setSort(0);
        }
        if (category.getStatus() == null) {
            category.setStatus(1);
        }
        categoryMapper.insert(category);
        return toVo(categoryMapper.selectById(category.getId()));
    }

    public Map<String, Object> update(Long id, CategorySaveRequest req) {
        adminPermissionService.require("category:write");
        Category existing = requireCategory(id);
        if (req.getType() != null && !req.getType().equals(existing.getType())) {
            throw new BusinessException(400, "不支持修改分类所属模块");
        }
        validateRequest(req);
        ensureUniqueName(existing.getType(), req.getName().trim(), id);
        fromRequest(existing, req);
        categoryMapper.updateById(existing);
        return toVo(categoryMapper.selectById(id));
    }

    public void delete(Long id) {
        adminPermissionService.require("category:write");
        Category category = requireCategory(id);
        long refs = countReferences(category.getId());
        if (refs > 0) {
            throw new BusinessException(400, "该分类下仍有 " + refs + " 条内容，请先调整内容分类后再删除");
        }
        categoryMapper.deleteById(id);
    }

    static void validateType(String type) {
        if (type == null || type.isBlank() || !VALID_TYPES.contains(type)) {
            throw new BusinessException(400, "无效的分类模块类型");
        }
    }

    private void validateRequest(CategorySaveRequest req) {
        if (req.getType() == null || req.getType().isBlank()) {
            throw new BusinessException(400, "请选择所属模块");
        }
        validateType(req.getType());
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "分类名称不能为空");
        }
        if (req.getName().trim().length() > 50) {
            throw new BusinessException(400, "分类名称不能超过 50 字");
        }
    }

    private void ensureUniqueName(String type, String name, Long excludeId) {
        LambdaQueryWrapper<Category> qw = new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type)
                .eq(Category::getName, name);
        if (excludeId != null) {
            qw.ne(Category::getId, excludeId);
        }
        if (categoryMapper.selectCount(qw) > 0) {
            throw new BusinessException(400, "同模块下已存在同名分类");
        }
    }

    private Category requireCategory(Long id) {
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(404, "分类不存在");
        }
        return category;
    }

    private long countReferences(Long categoryId) {
        long total = 0;
        total += newsMapper.selectCount(new LambdaQueryWrapper<News>().eq(News::getCategoryId, categoryId));
        total += hallMapper.selectCount(new LambdaQueryWrapper<Hall>().eq(Hall::getCategoryId, categoryId));
        total += craftMapper.selectCount(new LambdaQueryWrapper<Craft>().eq(Craft::getCategoryId, categoryId));
        total += courseMapper.selectCount(new LambdaQueryWrapper<Course>().eq(Course::getCategoryId, categoryId));
        total += resourceMapper.selectCount(new LambdaQueryWrapper<Resource>().eq(Resource::getCategoryId, categoryId));
        return total;
    }

    private Category fromRequest(Category category, CategorySaveRequest req) {
        if (req.getType() != null) {
            category.setType(req.getType().trim());
        }
        if (req.getName() != null) {
            category.setName(req.getName().trim());
        }
        if (req.getSort() != null) {
            category.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            category.setStatus(req.getStatus());
        }
        return category;
    }

    private Map<String, Object> toVo(Category c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("type", c.getType());
        m.put("name", c.getName());
        m.put("sort", c.getSort());
        m.put("status", c.getStatus());
        m.put("updateTime", FormatUtils.formatDateTime(c.getUpdateTime()));
        return m;
    }
}
