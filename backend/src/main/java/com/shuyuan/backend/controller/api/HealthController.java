package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查接口：聚合 DB、Redis 与版本信息，供探活与运维使用。
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthController {

    private static final String UP = "UP";
    private static final String DOWN = "DOWN";

    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;
    private final Environment environment;

    @Value("${info.app.version:0.0.1-SNAPSHOT}")
    private String version;

    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        String dbStatus = checkDb();
        String redisStatus = checkRedis();
        String overall = resolveOverallStatus(dbStatus, redisStatus);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", overall);
        body.put("db", dbStatus);
        body.put("redis", redisStatus);
        body.put("version", version);
        body.put("profile", activeProfile());
        body.put("time", LocalDateTime.now().toString());

        String commit = environment.getProperty("APP_COMMIT");
        if (commit != null && !commit.isBlank()) {
            body.put("commit", commit.trim());
        }

        return Result.ok(body);
    }

    private String checkDb() {
        try (Connection conn = dataSource.getConnection()) {
            conn.createStatement().execute("SELECT 1");
            return UP;
        } catch (Exception ignored) {
            return DOWN;
        }
    }

    private String checkRedis() {
        try {
            String pong = redisTemplate.execute((RedisCallback<String>) connection -> connection.ping());
            return pong != null && pong.equalsIgnoreCase("PONG") ? UP : DOWN;
        } catch (Exception ignored) {
            return DOWN;
        }
    }

    private String resolveOverallStatus(String dbStatus, String redisStatus) {
        if (UP.equals(dbStatus) && UP.equals(redisStatus)) {
            return UP;
        }
        if (DOWN.equals(dbStatus) || DOWN.equals(redisStatus)) {
            return DOWN;
        }
        return "DEGRADED";
    }

    private String activeProfile() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length == 0) {
            return "default";
        }
        return String.join(",", profiles);
    }
}
