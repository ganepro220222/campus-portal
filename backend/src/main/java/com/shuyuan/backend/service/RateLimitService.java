package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 接口限流：Redis 固定窗口计数（E2-3）
 */
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final String PREFIX = "ratelimit:";

    private final StringRedisTemplate redis;
    private final ShuyuanProperties properties;

    /** 按 IP 限流 */
    public void checkIp(String scene, String ip, int limit, Duration window) {
        check(scene, "ip:" + normalize(ip), limit, window);
    }

    /** 按用户 ID 限流 */
    public void checkUser(String scene, Long userId, int limit, Duration window) {
        if (userId == null) {
            return;
        }
        check(scene, "u:" + userId, limit, window);
    }

    void check(String scene, String keySuffix, int limit, Duration window) {
        if (!properties.getRateLimit().isEnabled() || limit <= 0) {
            return;
        }
        String redisKey = PREFIX + scene + ":" + keySuffix;
        Long count = redis.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redis.expire(redisKey, window);
        }
        if (count != null && count > limit) {
            throw new BusinessException(429, "操作过于频繁，请稍后再试");
        }
    }

    private String normalize(String value) {
        return value == null ? "unknown" : value.trim();
    }
}
