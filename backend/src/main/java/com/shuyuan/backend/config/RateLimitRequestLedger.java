package com.shuyuan.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.List;

/**
 * 单次 HTTP 请求内的限流退还账本：业务层与拦截器可能都会对同一把 Redis 键发起退还，
 * 这里保证「同一 request + 同一 key」最多生效一次。
 */
public final class RateLimitRequestLedger {

    static final String ATTR_REFUNDED_KEYS = "shuyuan.rateLimit.refundedKeys";

    private RateLimitRequestLedger() {
    }

    public static boolean wasRefunded(String redisKey) {
        return wasRefunded(currentRequest(), redisKey);
    }

    public static boolean wasRefunded(HttpServletRequest request, String redisKey) {
        if (request == null || redisKey == null || redisKey.isBlank()) {
            return false;
        }
        Object attr = request.getAttribute(ATTR_REFUNDED_KEYS);
        if (!(attr instanceof List<?> keys)) {
            return false;
        }
        return keys.contains(redisKey);
    }

    public static void markRefunded(String redisKey) {
        markRefunded(currentRequest(), redisKey);
    }

    public static void markRefunded(HttpServletRequest request, String redisKey) {
        if (request == null || redisKey == null || redisKey.isBlank()) {
            return;
        }
        Object attr = request.getAttribute(ATTR_REFUNDED_KEYS);
        if (attr instanceof List<?> existing) {
            @SuppressWarnings("unchecked")
            List<String> keys = (List<String>) existing;
            if (!keys.contains(redisKey)) {
                keys.add(redisKey);
            }
            return;
        }
        List<String> keys = new ArrayList<>(2);
        keys.add(redisKey);
        request.setAttribute(ATTR_REFUNDED_KEYS, keys);
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }
}
