package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.NavItemSaveRequest;
import com.shuyuan.backend.service.AdminNavItemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "首页入口")
@RestController
@RequestMapping("/api/v1/admin/nav-items")
@RequiredArgsConstructor
public class AdminNavItemController {

    private final AdminNavItemService adminNavItemService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminNavItemService.list(page, size));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody NavItemSaveRequest req) {
        return Result.ok(adminNavItemService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody NavItemSaveRequest req) {
        return Result.ok(adminNavItemService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminNavItemService.delete(id);
        return Result.ok();
    }
}
