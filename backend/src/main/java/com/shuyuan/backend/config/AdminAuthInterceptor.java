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
            Long roleId = jwtUtils.getAdminRoleId(token);
            if (adminId == null || roleId == null) {
                throw new BusinessException(401, "无效的管理员令牌");
            }
            SysUser user = sysUserMapper.selectById(adminId);
            if (user == null || user.getStatus() == null || user.getStatus() != 1) {
                throw new BusinessException(403, "管理员账号不可用");
            }
            SysRole role = sysRoleMapper.selectById(roleId);
            AdminContext.set(adminId, roleId,
                    adminPermissionService.parsePermissions(role != null ? role.getPermissions() : null));
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
}
