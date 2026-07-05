package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.AdminStatsService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.ok(adminStatsService.overview());
    }

    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> trend(
            @RequestParam(defaultValue = "30") int days) {
        return Result.ok(adminStatsService.trend(days));
    }

    @GetMapping("/modules")
    public Result<List<Map<String, Object>>> modules(
            @RequestParam(defaultValue = "7") int days) {
        return Result.ok(adminStatsService.modules(days));
    }

    @GetMapping("/content/top")
    public Result<List<Map<String, Object>>> contentTop(
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "10") int limit) {
        return Result.ok(adminStatsService.contentTop(targetType, limit));
    }

    @GetMapping("/export")
    public void export(
            @RequestParam(required = false) String month,
            HttpServletResponse response) throws IOException {
        adminStatsService.exportMonth(month, response);
    }
}
