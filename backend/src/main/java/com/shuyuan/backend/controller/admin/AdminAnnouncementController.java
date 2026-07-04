package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AnnouncementSaveRequest;
import com.shuyuan.backend.service.AdminAnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/announcements")
@RequiredArgsConstructor
public class AdminAnnouncementController {

    private final AdminAnnouncementService adminAnnouncementService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminAnnouncementService.list(page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminAnnouncementService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody AnnouncementSaveRequest req) {
        return Result.ok(adminAnnouncementService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody AnnouncementSaveRequest req) {
        return Result.ok(adminAnnouncementService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminAnnouncementService.delete(id);
        return Result.ok(null);
    }
}
