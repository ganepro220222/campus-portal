package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.HealthProbeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "健康检查")

/**
 * 健康检查接口：聚合 DB、Redis 与版本信息，供探活与运维使用。
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthController {

    private final HealthProbeService healthProbeService;
    private final Environment environment;

    @Value("${info.app.version:0.0.1-SNAPSHOT}")
    private String version;

    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        HealthProbeService.HealthSnapshot snapshot = healthProbeService.probe();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", snapshot.status());
        body.put("db", snapshot.db());
        body.put("redis", snapshot.redis());
        body.put("version", version);
        body.put("profile", activeProfile());
        body.put("time", LocalDateTime.now().toString());

        String commit = environment.getProperty("APP_COMMIT");
        if (commit != null && !commit.isBlank()) {
            body.put("commit", commit.trim());
        }

        return Result.ok(body);
    }

    private String activeProfile() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length == 0) {
            return "default";
        }
        return String.join(",", profiles);
    }
}
