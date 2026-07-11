package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.CategorySaveRequest;
import com.shuyuan.backend.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "分类管理")
@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam String type) {
        return Result.ok(adminCategoryService.list(type));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody CategorySaveRequest req) {
        return Result.ok(adminCategoryService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody CategorySaveRequest req) {
        return Result.ok(adminCategoryService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminCategoryService.delete(id);
        return Result.ok();
    }
}
