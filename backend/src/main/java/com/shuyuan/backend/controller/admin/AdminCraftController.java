package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.CraftSaveRequest;
import com.shuyuan.backend.dto.CraftViewerConfigSaveRequest;
import com.shuyuan.backend.service.AdminCraftService;
import com.shuyuan.backend.service.CraftViewerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "文创管理")
@RestController
@RequestMapping("/api/v1/admin/crafts")
@RequiredArgsConstructor
public class AdminCraftController {

    private final AdminCraftService adminCraftService;
    private final CraftViewerService craftViewerService;

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

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminCraftService.delete(id);
        return Result.ok();
    }

    /** 沉浸式鉴赏配置（编辑回填） */
    @GetMapping("/{id}/viewer-config")
    public Result<Map<String, Object>> viewerConfig(@PathVariable Long id) {
        return Result.ok(craftViewerService.getAdminViewerConfig(id));
    }

    /** 上传 GLB 并校验；可选 form 字段 transformJson（批处理 manifest） */
    @PostMapping("/{id}/model")
    public Result<Map<String, Object>> uploadModel(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "transformJson", required = false) String transformJson) {
        return Result.ok(craftViewerService.uploadModel(id, file, transformJson));
    }

    @PutMapping("/{id}/viewer-config")
    public Result<Map<String, Object>> saveViewerConfig(
            @PathVariable Long id,
            @RequestBody CraftViewerConfigSaveRequest req) {
        return Result.ok(craftViewerService.saveViewerConfig(id, req));
    }
}
