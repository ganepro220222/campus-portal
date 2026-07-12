package com.shuyuan.backend.util;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * HTTP 请求工具（客户端 IP 等）。
 * 默认不信任转发头，与 dev 环境行为一致；staging/prod 请注入 {@link ClientIpResolver}。
 */
public final class HttpRequestUtils {

    private HttpRequestUtils() {}

    public static String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String ip = ClientIpRules.resolve(
                request.getRemoteAddr(),
                request.getHeader("X-Forwarded-For"),
                request.getHeader("X-Real-IP"),
                false,
                List.of());
        return ip != null ? ip : "unknown";
    }
}
