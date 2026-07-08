package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.EnrollRejectRequest;
import com.shuyuan.backend.service.AdminEnrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "报名审核")
@RestController
@RequestMapping("/api/v1/admin/enrolls")
@RequiredArgsConstructor
public class AdminEnrollController {

    private final AdminEnrollService adminEnrollService;

    @PutMapping("/{id}/approve")
    public Result<Map<String, Object>> approve(@PathVariable Long id) {
        return Result.ok(adminEnrollService.approve(id));
    }

    @PutMapping("/{id}/reject")
    public Result<Map<String, Object>> reject(@PathVariable Long id, @RequestBody(required = false) EnrollRejectRequest req) {
        String reason = req != null ? req.getReason() : null;
        return Result.ok(adminEnrollService.reject(id, reason));
    }
}
