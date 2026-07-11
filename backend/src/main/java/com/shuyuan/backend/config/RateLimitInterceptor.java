package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.config.ShuyuanProperties.RateLimit;
import com.shuyuan.backend.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

/**
 * 敏感接口限流：登录、报名、AI 问答（E2-3）
 */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;
    private final ShuyuanProperties properties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }
        String method = request.getMethod();
        if (!"POST".equalsIgnoreCase(method)) {
            return true;
        }
        String uri = request.getRequestURI();
        String ip = resolveClientIp(request);
        RateLimit cfg = properties.getRateLimit();

        if (uri.endsWith("/api/v1/auth/account-login")) {
            rateLimitService.checkIp("login", ip, cfg.getLoginPerMinute(), Duration.ofMinutes(1));
            return true;
        }
        if (uri.endsWith("/api/v1/auth/wx-login")) {
            rateLimitService.checkIp("wx-login", ip, cfg.getWxLoginPerMinute(), Duration.ofMinutes(1));
            return true;
        }
        if (uri.endsWith("/api/v1/admin/auth/login")) {
            rateLimitService.checkIp("admin-login", ip, cfg.getAdminLoginPerMinute(), Duration.ofMinutes(1));
            return true;
        }
        if (uri.matches(".*/api/v1/activities/\\d+/enroll")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                rateLimitService.checkUser("enroll", memberId, cfg.getEnrollPerMinute(), Duration.ofMinutes(1));
            } else {
                rateLimitService.checkIp("enroll", ip, cfg.getEnrollPerMinute(), Duration.ofMinutes(1));
            }
            return true;
        }
        if (uri.matches(".*/api/v1/ai/chat/sessions/\\d+/messages")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                rateLimitService.checkUser("ai", memberId, cfg.getAiPerDay(), Duration.ofDays(1));
            } else {
                rateLimitService.checkIp("ai", ip, cfg.getAiPerDay(), Duration.ofDays(1));
            }
            return true;
        }
        if (uri.endsWith("/api/v1/admin/ai/polish")) {
            Long adminId = AdminContext.getAdminId();
            if (adminId != null) {
                rateLimitService.checkUser(
                        "ai-polish",
                        adminId,
                        properties.getAi().getDailyLimit(),
                        Duration.ofDays(1));
            }
        }
        return true;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
