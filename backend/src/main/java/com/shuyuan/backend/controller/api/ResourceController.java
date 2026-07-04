package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public Result<List<Map<String, Object>>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String fileType) {
        return Result.ok(resourceService.list(category, fileType));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(resourceService.detail(id));
    }

    @PostMapping("/{id}/download")
    public Result<Map<String, Object>> download(@PathVariable Long id) {
        return Result.ok(resourceService.download(id));
    }
}
