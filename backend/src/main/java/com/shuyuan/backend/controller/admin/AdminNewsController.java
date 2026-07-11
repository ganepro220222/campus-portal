package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.NewsSaveRequest;
import com.shuyuan.backend.service.AdminNewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "新闻管理")
@RestController
@RequestMapping("/api/v1/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final AdminNewsService adminNewsService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminNewsService.list(status, categoryId, page, size));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody NewsSaveRequest req) {
        return Result.ok(adminNewsService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody NewsSaveRequest req) {
        return Result.ok(adminNewsService.update(id, req));
    }

    @PutMapping("/{id}/publish")
    public Result<Map<String, Object>> publish(@PathVariable Long id) {
        return Result.ok(adminNewsService.publish(id));
    }

    @PutMapping("/{id}/unpublish")
    public Result<Map<String, Object>> unpublish(@PathVariable Long id) {
        return Result.ok(adminNewsService.unpublish(id));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminNewsService.delete(id);
        return Result.ok();
    }
}
