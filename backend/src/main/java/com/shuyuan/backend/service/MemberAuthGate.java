package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberSession;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.util.TokenVersionSupport;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 小程序会员 token 请求期校验：账号状态、token 版本、强制改密写操作拦截。
 */
@Service
@RequiredArgsConstructor
public class MemberAuthGate {

    private final JwtUtils jwtUtils;
    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;

    /**
     * 解析会员 JWT；非会员 token 返回 null；会员 token 校验失败抛 BusinessException。
     */
    public MemberSession resolveMemberSession(String token) {
        Long memberId = jwtUtils.getMemberId(token);
        if (memberId == null) {
            return null;
        }
        int tokenVersion = jwtUtils.getTokenVersion(token);
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(401, "登录已失效，请重新登录");
        }
        if (TokenVersionSupport.current(member.getTokenVersion()) != tokenVersion) {
            throw new BusinessException(401, "登录已失效，请重新登录");
        }
        if (member.getStatus() == null || member.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        if (account != null && (account.getStatus() == null || account.getStatus() != 1)) {
            throw new BusinessException(403, "账号已被禁用");
        }
        boolean mustChange = account != null
                && account.getMustChangePassword() != null
                && account.getMustChangePassword() == 1;
        return new MemberSession(memberId, mustChange);
    }

    public boolean blocksWriteForMustChangePassword(HttpServletRequest request, MemberSession session) {
        if (session == null || !session.mustChangePassword()) {
            return false;
        }
        return isWriteMethod(request) && !isAllowedWhenMustChangePassword(request);
    }

    static boolean isWriteMethod(HttpServletRequest request) {
        String method = request.getMethod();
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method);
    }

    /** 须改密账号仅允许读操作与改密接口 */
    static boolean isAllowedWhenMustChangePassword(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)
                || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        return "POST".equalsIgnoreCase(method)
                && "/api/v1/auth/change-password".equals(request.getRequestURI());
    }
}
