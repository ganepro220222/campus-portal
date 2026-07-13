package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.ResourceSaveRequest;
import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import com.shuyuan.backend.service.AdminResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "资源管理")
@RestController
@RequestMapping("/api/v1/admin/resources")
@RequiredArgsConstructor
public class AdminResourceController {

    private final AdminResourceService adminResourceService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminResourceService.list(categoryId, fileType, status, page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminResourceService.detail(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@Validated(Create.class) @RequestBody ResourceSaveRequest req) {
        return Result.ok(adminResourceService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id,
                                              @Validated(Update.class) @RequestBody ResourceSaveRequest req) {
        return Result.ok(adminResourceService.update(id, req));
    }

    @PutMapping("/{id}/publish")
    public Result<Map<String, Object>> publish(@PathVariable Long id) {
        return Result.ok(adminResourceService.publish(id));
    }

    @PutMapping("/{id}/unpublish")
    public Result<Map<String, Object>> unpublish(@PathVariable Long id) {
        return Result.ok(adminResourceService.unpublish(id));
    }
}
