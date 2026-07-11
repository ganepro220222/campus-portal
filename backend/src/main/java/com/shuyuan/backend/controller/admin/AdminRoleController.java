package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AdminRoleSaveRequest;
import com.shuyuan.backend.service.AdminRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

@Tag(name = "管理员角色")
@RestController
@RequestMapping("/api/v1/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    @GetMapping
    public Result<List<Map<String, Object>>> list() {
        return Result.ok(adminRoleService.list());
    }

    @GetMapping("/permission-catalog")
    public Result<List<Map<String, Object>>> permissionCatalog() {
        return Result.ok(adminRoleService.permissionCatalog());
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody AdminRoleSaveRequest req) {
        return Result.ok(adminRoleService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody AdminRoleSaveRequest req) {
        return Result.ok(adminRoleService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminRoleService.delete(id);
        return Result.ok();
    }
}
