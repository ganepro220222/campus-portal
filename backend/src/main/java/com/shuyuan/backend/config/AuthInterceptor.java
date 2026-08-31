package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.context.MemberSession;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.service.MemberAuthGate;
import com.shuyuan.backend.util.MemberBearerToken;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 解析会员 JWT，校验账号状态 / token 版本 / 强制改密端点白名单，写入 {@link MemberContext}。
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final MemberAuthGate memberAuthGate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = MemberBearerToken.from(request);
        if (token.isEmpty()) {
            return true;
        }
        try {
            MemberSession session = memberAuthGate.resolveMemberSession(token);
            if (session != null) {
                MemberContext.set(session);
                memberAuthGate.ensureAllowedOrThrow(request, session);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception ignored) {
            // 非会员 token 或解析失败：不阻断公开读接口
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        MemberContext.clear();
    }
}
