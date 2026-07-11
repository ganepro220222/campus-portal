package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.CraftSaveRequest;
import com.shuyuan.backend.service.AdminCraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "文创管理")
@RestController
@RequestMapping("/api/v1/admin/crafts")
@RequiredArgsConstructor
public class AdminCraftController {

    private final AdminCraftService adminCraftService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminCraftService.list(categoryId, status, page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminCraftService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody CraftSaveRequest req) {
        return Result.ok(adminCraftService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody CraftSaveRequest req) {
        return Result.ok(adminCraftService.update(id, req));
    }

    @PutMapping("/{id}/publish")
    public Result<Map<String, Object>> publish(@PathVariable Long id) {
        return Result.ok(adminCraftService.publish(id));
    }

    @PutMapping("/{id}/unpublish")
    public Result<Map<String, Object>> unpublish(@PathVariable Long id) {
        return Result.ok(adminCraftService.unpublish(id));
    }
}
