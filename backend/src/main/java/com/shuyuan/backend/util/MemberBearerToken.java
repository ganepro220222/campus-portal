package com.shuyuan.backend.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * 小程序会员 token：优先 Authorization Bearer。
 * {@code GET /resources/{id}/file} 允许 {@code access_token} 查询参数——
 * 微信 {@code wx.downloadFile} 带 header 时会误报「url not in domain list」。
 */
public final class MemberBearerToken {

    private MemberBearerToken() {
    }

    public static String from(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = header.substring(7).trim();
            if (StringUtils.hasText(token)) {
                return token;
            }
        }
        if (isResourceFileGet(request)) {
            String query = request.getParameter("access_token");
            if (StringUtils.hasText(query)) {
                return query.trim();
            }
        }
        return "";
    }

    static boolean isResourceFileGet(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        if (uri == null || uri.contains("/admin/") || !uri.contains("/resources/")) {
            return false;
        }
        return uri.endsWith("/file") || uri.matches(".*/resources/[0-9]+/file/[^/]+$");
    }
}
