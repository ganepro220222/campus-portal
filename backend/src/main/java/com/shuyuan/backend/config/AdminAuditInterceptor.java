package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.service.AdminAuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 管理后台写操作审计：POST/PUT/DELETE 成功响应后写入 sys_log
 */
@Component
@RequiredArgsConstructor
public class AdminAuditInterceptor implements HandlerInterceptor {

    private final AdminAuditLogService adminAuditLogService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        if (ex != null || response.getStatus() >= 400) {
            return;
        }
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)) {
            return;
        }
        Long adminId = AdminContext.getAdminId();
        if (adminId == null) {
            return;
        }
        String uri = request.getRequestURI();
        String action = buildAction(method, uri);
        adminAuditLogService.record(adminId, action, uri, resolveClientIp(request));
    }

    private String buildAction(String method, String uri) {
        String path = uri;
        if (path.startsWith("/api/v1/admin/")) {
            path = path.substring("/api/v1/admin/".length());
        } else if (path.startsWith("/api/v1/admin")) {
            path = path.substring("/api/v1/admin".length());
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        String verb = switch (method.toUpperCase()) {
            case "POST" -> "新增";
            case "PUT" -> "修改";
            case "DELETE" -> "删除";
            case "PATCH" -> "变更";
            default -> method.toUpperCase();
        };
        return path.isEmpty() ? verb : verb + " · " + path;
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
