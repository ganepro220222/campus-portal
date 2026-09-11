package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.HomeRecommendSaveRequest;
import com.shuyuan.backend.service.AdminHomeRecommendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "首页推荐")
@RestController
@RequestMapping("/api/v1/admin/home-recommends")
@RequiredArgsConstructor
public class AdminHomeRecommendController {

    private final AdminHomeRecommendService adminHomeRecommendService;

    @GetMapping
    public Result<Map<String, Object>> list() {
        return Result.ok(adminHomeRecommendService.listGrouped());
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody HomeRecommendSaveRequest req) {
        return Result.ok(adminHomeRecommendService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody HomeRecommendSaveRequest req) {
        return Result.ok(adminHomeRecommendService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminHomeRecommendService.delete(id);
        return Result.ok();
    }
}
