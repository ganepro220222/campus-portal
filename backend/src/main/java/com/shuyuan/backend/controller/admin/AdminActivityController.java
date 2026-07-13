package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.ActivitySaveRequest;
import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import com.shuyuan.backend.service.AdminActivityService;
import com.shuyuan.backend.service.AdminEnrollService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "活动管理")
@RestController
@RequestMapping("/api/v1/admin/activities")
@RequiredArgsConstructor
public class AdminActivityController {

    private final AdminActivityService adminActivityService;
    private final AdminEnrollService adminEnrollService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminActivityService.list(status, page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminActivityService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@Validated(Create.class) @RequestBody ActivitySaveRequest req) {
        return Result.ok(adminActivityService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id,
                                              @Validated(Update.class) @RequestBody ActivitySaveRequest req) {
        return Result.ok(adminActivityService.update(id, req));
    }

    @PutMapping("/{id}/publish")
    public Result<Map<String, Object>> publish(@PathVariable Long id) {
        return Result.ok(adminActivityService.publish(id));
    }

    @PutMapping("/{id}/cancel")
    public Result<Map<String, Object>> cancel(@PathVariable Long id) {
        return Result.ok(adminActivityService.cancel(id));
    }

    @GetMapping("/{id}/enrolls")
    public Result<PageResult<Map<String, Object>>> enrolls(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminEnrollService.listByActivity(id, status, page, size));
    }

    @GetMapping("/{id}/enrolls/export")
    public void exportEnrolls(
            @PathVariable Long id,
            @RequestParam(defaultValue = "audit") String scope,
            HttpServletResponse response) throws IOException {
        adminEnrollService.exportExcel(id, scope, response);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminActivityService.delete(id);
        return Result.ok();
    }
}
