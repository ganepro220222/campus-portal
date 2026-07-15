package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.CraftService;
import com.shuyuan.backend.service.CraftViewerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "文创展示")
@RestController
@RequestMapping("/api/v1/crafts")
@RequiredArgsConstructor
public class CraftController {

    private final CraftService craftService;
    private final CraftViewerService craftViewerService;

    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam(required = false) String category) {
        return Result.ok(craftService.list(category));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(craftService.detail(id));
    }

    /** 沉浸式 3D 鉴赏页配置（H5 一次拉全） */
    @GetMapping("/{id}/viewer")
    public Result<Map<String, Object>> viewer(@PathVariable Long id) {
        return Result.ok(craftViewerService.getViewerConfig(id));
    }
}
