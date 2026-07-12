package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 管理后台 JWT 校验（/api/v1/admin/**，登录接口除外）
 */
@Component
@RequiredArgsConstructor
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;
    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final AdminPermissionService adminPermissionService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new BusinessException(401, "请先登录管理后台");
        }
        try {
            String token = auth.substring(7);
            Long adminId = jwtUtils.getAdminId(token);
            Long tokenRoleId = jwtUtils.getAdminRoleId(token);
            if (adminId == null || tokenRoleId == null) {
                throw new BusinessException(401, "无效的管理员令牌");
            }
            SysUser user = sysUserMapper.selectById(adminId);
            if (user == null || user.getStatus() == null || user.getStatus() != 1) {
                throw new BusinessException(403, "管理员账号不可用");
            }
            Long roleId = user.getRoleId();
            if (roleId == null) {
                throw new BusinessException(403, "管理员账号未分配角色");
            }
            if (!roleId.equals(tokenRoleId)) {
                throw new BusinessException(401, "权限已变更，请重新登录");
            }
            SysRole role = sysRoleMapper.selectById(roleId);
            if (role == null) {
                throw new BusinessException(403, "管理员角色不可用");
            }
            AdminContext.set(adminId, roleId,
                    adminPermissionService.parsePermissions(role.getPermissions()));
            if (mustChangePassword(user) && !isAllowedWhenMustChangePassword(request)) {
                throw new BusinessException(403, "请先修改密码后再操作");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(401, "登录已过期，请重新登录");
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        AdminContext.clear();
    }

    private boolean mustChangePassword(SysUser user) {
        return user.getMustChangePassword() != null && user.getMustChangePassword() == 1;
    }

    /** 须改密账号仅允许读操作与改密接口 */
    private boolean isAllowedWhenMustChangePassword(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)
                || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        return "PUT".equalsIgnoreCase(method)
                && "/api/v1/admin/auth/change-password".equals(request.getRequestURI());
    }
}
