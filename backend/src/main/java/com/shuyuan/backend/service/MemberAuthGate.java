package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.ApiErrorKeys;
import com.shuyuan.backend.common.context.MemberContext;
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

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 小程序会员 token 请求期校验：账号状态、token 版本、强制改密端点白名单。
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

    /** 须改密账号：除白名单端点外一律拒绝 */
    public boolean blocksForMustChangePassword(HttpServletRequest request, MemberSession session) {
        if (session == null || !session.mustChangePassword()) {
            return false;
        }
        if (isPreflight(request)) {
            return false;
        }
        return !isAllowedWhenMustChangePassword(request);
    }

    public void ensureAllowedOrThrow(HttpServletRequest request, MemberSession session) {
        if (blocksForMustChangePassword(request, session)) {
            throw new BusinessException(
                    403,
                    "请先修改初始密码",
                    ApiErrorKeys.MEMBER_PASSWORD_CHANGE_REQUIRED);
        }
    }

    public Map<String, Object> buildSessionSnapshot() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        boolean mustChange = account != null
                && account.getMustChangePassword() != null
                && account.getMustChangePassword() == 1;
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("loggedIn", true);
        body.put("memberId", memberId);
        body.put("mustChangePassword", mustChange);
        return body;
    }

    static boolean isPreflight(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    /** 须改密期间仅允许会话查询、改密与重新登录 */
    static boolean isAllowedWhenMustChangePassword(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        if ("GET".equalsIgnoreCase(method) && "/api/v1/auth/session".equals(uri)) {
            return true;
        }
        if (!"POST".equalsIgnoreCase(method)) {
            return false;
        }
        return "/api/v1/auth/change-password".equals(uri)
                || "/api/v1/auth/account-login".equals(uri)
                || "/api/v1/auth/wx-login".equals(uri)
                || "/api/v1/auth/wx-bind".equals(uri);
    }
}
