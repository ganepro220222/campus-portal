package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AdminResetPasswordRequest;
import com.shuyuan.backend.dto.AdminUserSaveRequest;
import com.shuyuan.backend.service.AdminUserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "管理员账号")
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminUserService.list(keyword, page, size));
    }

    @GetMapping("/role-options")
    public Result<List<Map<String, Object>>> roleOptions() {
        return Result.ok(adminUserService.roleOptions());
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody AdminUserSaveRequest req) {
        return Result.ok(adminUserService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody AdminUserSaveRequest req) {
        return Result.ok(adminUserService.update(id, req));
    }

    @PutMapping("/{id}/reset-password")
    public Result<Map<String, Object>> resetPassword(@PathVariable Long id,
                                                     @RequestBody(required = false) AdminResetPasswordRequest req) {
        return Result.ok(adminUserService.resetPassword(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminUserService.delete(id);
        return Result.ok();
    }
}
