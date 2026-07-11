package com.shuyuan.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;

/**
 * DB / Redis 探活，供 health 接口与运维告警任务复用。
 */
@Service
@RequiredArgsConstructor
public class HealthProbeService {

    private static final String UP = "UP";
    private static final String DOWN = "DOWN";

    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;

    public HealthSnapshot probe() {
        String dbStatus = checkDb();
        String redisStatus = checkRedis();
        return new HealthSnapshot(resolveOverallStatus(dbStatus, redisStatus), dbStatus, redisStatus);
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

    public record HealthSnapshot(String status, String db, String redis) {
        public boolean isHealthy() {
            return UP.equals(status);
        }
    }
}
