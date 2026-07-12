package com.shuyuan.backend.util;

import com.shuyuan.backend.config.ShuyuanProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 统一解析客户端 IP，供限流、审计与业务接口复用。
 */
@Component
@RequiredArgsConstructor
public class ClientIpResolver {

    private final ShuyuanProperties properties;

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        ShuyuanProperties.Security security = properties.getSecurity();
        String ip = ClientIpRules.resolve(
                request.getRemoteAddr(),
                request.getHeader("X-Forwarded-For"),
                request.getHeader("X-Real-IP"),
                security.isTrustForwardedHeaders(),
                security.getTrustedProxies());
        return ip != null ? ip : "unknown";
    }
}
