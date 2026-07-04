package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 解析 JWT，将 memberId 写入上下文（可选登录，不强制拦截）
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            try {
                Long memberId = jwtUtils.getMemberId(auth.substring(7));
                MemberContext.setMemberId(memberId);
            } catch (Exception ignored) {
                // token 无效时不阻断公开读接口
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        MemberContext.clear();
    }
}
