package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.service.RateLimitService;
import com.shuyuan.backend.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 敏感接口限流：登录、报名、AI 问答（E2-3）
 *
 * <p>计数在 preHandle 里就扣，也就是请求还没进 Controller 就先占一次。这是限流该有的样子
 * （不然就挡不住打进来的量），代价是「服务端自己没干成」的那几种失败也会把用户的次数吃掉。
 * 所以这里把每次占用的计数键记在 request 上，afterCompletion 再按结果决定退不退。
 */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    /** 本次请求占用了哪些计数键（可能不止一个），供 afterCompletion 退还 */
    static final String ATTR_OCCUPIED_KEYS = "shuyuan.rateLimit.occupiedKeys";

    private final RateLimitService rateLimitService;
    private final ShuyuanProperties properties;
    private final ClientIpResolver clientIpResolver;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String ip = clientIpResolver.resolve(request);
        ShuyuanProperties.RateLimit cfg = properties.getRateLimit();

        if (uri.endsWith("/api/v1/miniapp/wxacode")) {
            occupy(request, rateLimitService.checkIp("wxacode", ip, cfg.getWxacodePerMinute(), Duration.ofMinutes(1)));
            return true;
        }
        if (uri.endsWith("/api/v1/miniapp/upload")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                occupy(request, rateLimitService.checkUser("miniapp-upload", memberId, 20, Duration.ofMinutes(1)));
            } else {
                occupy(request, rateLimitService.checkIp("miniapp-upload", ip, 10, Duration.ofMinutes(1)));
            }
            return true;
        }
        if (!"POST".equalsIgnoreCase(method)) {
            return true;
        }

        if (uri.endsWith("/api/v1/auth/account-login")) {
            occupy(request, rateLimitService.checkIp("login", ip, cfg.getLoginPerMinute(), Duration.ofMinutes(1)));
            return true;
        }
        if (uri.endsWith("/api/v1/auth/wx-login")
                || uri.endsWith("/api/v1/auth/wx-bind")
                || uri.endsWith("/api/v1/auth/wx-bind-authenticated")) {
            occupy(request, rateLimitService.checkIp("wx-login", ip, cfg.getWxLoginPerMinute(), Duration.ofMinutes(1)));
            return true;
        }
        if (uri.endsWith("/api/v1/admin/auth/login")) {
            occupy(request, rateLimitService.checkIp("admin-login", ip, cfg.getAdminLoginPerMinute(), Duration.ofMinutes(1)));
            return true;
        }
        if (uri.matches(".*/api/v1/activities/\\d+/enroll")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                occupy(request, rateLimitService.checkUser("enroll", memberId, cfg.getEnrollPerMinute(), Duration.ofMinutes(1)));
            } else {
                occupy(request, rateLimitService.checkIp("enroll", ip, cfg.getEnrollPerMinute(), Duration.ofMinutes(1)));
            }
            return true;
        }
        if (uri.matches(".*/api/v1/ai/chat/sessions/\\d+/messages")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                occupy(request, rateLimitService.checkUserCalendarDay(
                        RateLimitService.SCENE_AI, memberId, cfg.getAiPerDay()));
            } else {
                occupy(request, rateLimitService.checkIp(
                        RateLimitService.SCENE_AI, ip, cfg.getAiPerDay(), Duration.ofDays(1)));
            }
            return true;
        }
        if (uri.matches(".*/api/v1/courses/\\d+/progress")) {
            Long memberId = MemberContext.getMemberId();
            if (memberId != null) {
                occupy(request, rateLimitService.checkUser("course-progress", memberId, cfg.getProgressPerMinute(), Duration.ofMinutes(1)));
            } else {
                occupy(request, rateLimitService.checkIp("course-progress", ip, cfg.getProgressPerMinute(), Duration.ofMinutes(1)));
            }
            return true;
        }
        if (uri.endsWith("/api/v1/admin/ai/polish")) {
            Long adminId = AdminContext.getAdminId();
            if (adminId != null) {
                // 与小程序端同口径按自然日结算。原来用 Duration.ofDays(1) 是从当天第一次调用
                // 起算的滚动 24 小时——「昨天上午用满、今天上午才恢复」，管理员无从理解。
                occupy(request, rateLimitService.checkUserCalendarDay(
                        RateLimitService.SCENE_AI_POLISH, adminId, properties.getAi().getDailyLimit()));
            }
        }
        return true;
    }

    /**
     * 请求结束后按结果决定是否退还本次占用。
     *
     * <p><b>只退 5xx（以及漏到容器的异常）。</b>4xx 一概不退：入参不合法、内容安全不通过、
     * 权限不足、会话不存在、以及超限本身，都属于「这个请求自己有问题」。要是连这些也退，
     * 就等于允许拿非法请求无限次敲这些接口，限流的防刷作用当场归零。
     *
     * <p>另外要清楚这里救不了什么：客户端超时时服务端往往是 200 成功、答案也已落库，
     * 状态码看不出异常，退还机制对它无能为力——那个得靠把客户端超时调够。
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        Object attr = request.getAttribute(ATTR_OCCUPIED_KEYS);
        if (!(attr instanceof List<?> keys) || keys.isEmpty()) {
            return;
        }
        request.removeAttribute(ATTR_OCCUPIED_KEYS);
        if (ex == null && response.getStatus() < 500) {
            return;
        }
        for (Object key : keys) {
            String redisKey = (String) key;
            if (RateLimitRequestLedger.wasRefunded(request, redisKey)) {
                continue;
            }
            rateLimitService.refundKey(redisKey);
        }
    }

    /** 记下本次占用的计数键；key 为 null 表示这次压根没计数（限流关闭 / 无用户身份） */
    private void occupy(HttpServletRequest request, String key) {
        if (key == null) {
            return;
        }
        Object attr = request.getAttribute(ATTR_OCCUPIED_KEYS);
        if (attr instanceof List<?>) {
            @SuppressWarnings("unchecked")
            List<String> existing = (List<String>) attr;
            existing.add(key);
            return;
        }
        List<String> keys = new ArrayList<>(2);
        keys.add(key);
        request.setAttribute(ATTR_OCCUPIED_KEYS, keys);
    }
}
