package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    /**
     * 尝试占用用户配额：未超限则递增并返回 true；超限返回 false 且不抛异常。
     * 用于课程完成积分等「可降级」场景。
     */
    public boolean tryAcquireUser(String scene, Long userId, int limit, Duration window) {
        if (userId == null || !properties.getRateLimit().isEnabled() || limit <= 0) {
            return true;
        }
        String redisKey = PREFIX + scene + ":u:" + userId;
        Long count = redis.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redis.expire(redisKey, window);
        }
        if (count != null && count > limit) {
            redis.opsForValue().decrement(redisKey);
            return false;
        }
        return true;
    }

    /** 按自然日限流（key 含 yyyy-MM-dd，TTL 至次日 0 点） */
    public void checkUserCalendarDay(String scene, Long userId, int limit) {
        if (userId == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        Duration untilMidnight = Duration.between(LocalDateTime.now(), today.plusDays(1).atStartOfDay());
        if (untilMidnight.isZero() || untilMidnight.isNegative()) {
            untilMidnight = Duration.ofMinutes(1);
        }
        check(scene, calendarDayKeySuffix(userId, today), limit, untilMidnight);
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
            String message = "ai".equals(scene)
                    ? "今日问答次数已用完，请明天再来"
                    : "操作过于频繁，请稍后再试";
            throw new BusinessException(429, message);
        }
    }

    /** 查询用户在某场景下的已用次数（只读，不递增） */
    public int getUserUsage(String scene, Long userId) {
        if (userId == null) {
            return 0;
        }
        return getUsage(scene, "u:" + userId);
    }

    /** 查询用户当日（自然日）已用次数 */
    public int getUserCalendarDayUsage(String scene, Long userId) {
        if (userId == null) {
            return 0;
        }
        return getUsage(scene, calendarDayKeySuffix(userId, LocalDate.now()));
    }

    int getUsage(String scene, String keySuffix) {
        if (!properties.getRateLimit().isEnabled()) {
            return 0;
        }
        String val = redis.opsForValue().get(PREFIX + scene + ":" + keySuffix);
        if (val == null || val.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String normalize(String value) {
        return value == null ? "unknown" : value.trim();
    }

    private String calendarDayKeySuffix(Long userId, LocalDate day) {
        return "u:" + userId + ":" + day;
    }
}
