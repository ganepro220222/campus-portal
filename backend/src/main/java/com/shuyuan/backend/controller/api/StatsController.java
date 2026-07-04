package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    /** DAU 埋点占位，后续接入 Redis 统计 */
    @PostMapping("/active")
    public Result<Void> active() {
        return Result.ok();
    }
}
