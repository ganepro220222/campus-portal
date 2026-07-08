package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.CourseSaveRequest;
import com.shuyuan.backend.dto.SubtitleUpdateRequest;
import com.shuyuan.backend.service.AdminCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "课程管理")
@RestController
@RequestMapping("/api/v1/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminCourseService.list(categoryId, status, page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminCourseService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody CourseSaveRequest req) {
        return Result.ok(adminCourseService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody CourseSaveRequest req) {
        return Result.ok(adminCourseService.update(id, req));
    }

    @PostMapping("/{id}/subtitle/trigger")
    public Result<Map<String, Object>> triggerSubtitle(@PathVariable Long id) {
        return Result.ok(adminCourseService.triggerSubtitle(id));
    }

    @GetMapping("/{id}/subtitle/status")
    public Result<Map<String, Object>> subtitleStatus(@PathVariable Long id) {
        return Result.ok(adminCourseService.subtitleStatus(id));
    }

    @PutMapping("/{id}/subtitle")
    public Result<Map<String, Object>> updateSubtitle(@PathVariable Long id, @RequestBody SubtitleUpdateRequest req) {
        return Result.ok(adminCourseService.updateSubtitle(id, req));
    }
}
