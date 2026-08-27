package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 接口限流：Redis 固定窗口计数（E2-3）
 */
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final String PREFIX = "ratelimit:";

    /** 小程序 AI 问答（每人每自然日） */
    public static final String SCENE_AI = "ai";
    /** 后台 AI 文案辅助：润色/扩写/摘要/标题/英译共用一个计数（每人每自然日） */
    public static final String SCENE_AI_POLISH = "ai-polish";

    /*
     * 退还一次已占用的计数。
     *
     * <p>不能直接 DECR：Redis 对**不存在**的键执行 DECR 会新建一个值为 -1 且**不带 TTL** 的键。
     * 请求跨过窗口边界时（自然日键跨零点、分钟窗口跨整分），窗口键正好在退还前过期，
     * 直接 DECR 就会凭空造出一个永不过期的负数键——带日期的键永久泄漏，
     * 不带日期的键（如 ratelimit:enroll:u:7）还会让这个用户凭空多出额度且计数错乱。
     * 用 Lua 把「存在才减」做成一步原子操作，从根上消掉这一类。
     */
    private static final RedisScript<Long> REFUND_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end return -1",
            Long.class);

    private final StringRedisTemplate redis;
    private final ShuyuanProperties properties;

    /** 按 IP 限流；返回本次占用的计数键（未计数时返回 null），供失败退还使用 */
    public String checkIp(String scene, String ip, int limit, Duration window) {
        return check(scene, "ip:" + normalize(ip), limit, window);
    }

    /** 按用户 ID 限流；返回本次占用的计数键（未计数时返回 null） */
    public String checkUser(String scene, Long userId, int limit, Duration window) {
        if (userId == null) {
            return null;
        }
        return check(scene, "u:" + userId, limit, window);
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
            // 走 refundKey 而不是裸 DECR：与失败退还同一套「存在才减」的保护，理由见 REFUND_SCRIPT
            refundKey(redisKey);
            return false;
        }
        return true;
    }

    /** 按自然日限流（key 含 yyyy-MM-dd，TTL 至次日 0 点）；返回本次占用的计数键 */
    public String checkUserCalendarDay(String scene, Long userId, int limit) {
        if (userId == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        Duration untilMidnight = Duration.between(LocalDateTime.now(), today.plusDays(1).atStartOfDay());
        if (untilMidnight.isZero() || untilMidnight.isNegative()) {
            untilMidnight = Duration.ofMinutes(1);
        }
        return check(scene, calendarDayKeySuffix(userId, today), limit, untilMidnight);
    }

    /**
     * 退还一次已占用的计数（仅当计数键仍存在时才回退，见 REFUND_SCRIPT 的说明）。
     *
     * <p>只该用于「服务端自己没干成」的失败。入参、权限、超限一类的 4xx 不要退：
     * 退了就等于允许拿非法请求无限次敲这些接口，限流本身也就废了。
     */
    public void refundKey(String redisKey) {
        if (redisKey == null || redisKey.isBlank() || !properties.getRateLimit().isEnabled()) {
            return;
        }
        redis.execute(REFUND_SCRIPT, List.of(redisKey));
    }

    String check(String scene, String keySuffix, int limit, Duration window) {
        if (!properties.getRateLimit().isEnabled() || limit <= 0) {
            return null;
        }
        String redisKey = PREFIX + scene + ":" + keySuffix;
        Long count = redis.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redis.expire(redisKey, window);
        }
        if (count != null && count > limit) {
            throw new BusinessException(429, limitMessage(scene, limit));
        }
        return redisKey;
    }

    /**
     * 超限时给用户看的话。
     *
     * <p>按天算的额度必须说清「今天用完了、明天再来」；说成「操作过于频繁，请稍后再试」，
     * 用户会理解成歇一会儿就能接着用，于是反复点、反复看到同一句话。
     */
    private static String limitMessage(String scene, int limit) {
        return switch (scene) {
            case SCENE_AI -> "今日问答次数已用完，请明天再来";
            case SCENE_AI_POLISH -> "今日 AI 文案辅助次数已用完（每人每天 " + limit + " 次），请明天再试";
            default -> "操作过于频繁，请稍后再试";
        };
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
