package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.EnrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "活动报名")
@RestController
@RequestMapping("/api/v1/enrolls")
@RequiredArgsConstructor
public class EnrollController {

    private final EnrollService enrollService;

    @GetMapping("/{id}/voucher")
    public Result<Map<String, Object>> voucher(@PathVariable Long id) {
        return Result.ok(enrollService.voucher(id));
    }
}
