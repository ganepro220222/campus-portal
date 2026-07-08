package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.entity.Category;
import com.shuyuan.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "分类")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam String type) {
        List<Map<String, Object>> list = categoryService.listByType(type).stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("categoryName", c.getName());
            return m;
        }).toList();
        return Result.ok(list);
    }
}
