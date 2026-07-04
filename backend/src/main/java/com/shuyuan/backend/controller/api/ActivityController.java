package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.EnrollRequest;
import com.shuyuan.backend.service.ActivityService;
import com.shuyuan.backend.service.EnrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final EnrollService enrollService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(activityService.list(page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(activityService.detail(id));
    }

    @PostMapping("/{id}/enroll")
    public Result<Map<String, Object>> enroll(@PathVariable Long id, @RequestBody(required = false) EnrollRequest req) {
        return Result.ok(enrollService.enroll(id, req != null ? req : new EnrollRequest()));
    }

    @DeleteMapping("/{id}/enroll")
    public Result<Void> cancelEnroll(@PathVariable Long id) {
        enrollService.cancelEnroll(id);
        return Result.ok();
    }
}
