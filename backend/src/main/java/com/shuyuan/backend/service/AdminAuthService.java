package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminLoginRequest;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.util.AdminPasswordPolicy;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.util.TokenVersionSupport;
import com.shuyuan.backend.vo.AdminLoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/** 管理端登录鉴权与自助改密 */
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final JwtUtils jwtUtils;
    private final AdminPermissionService adminPermissionService;
    private final LoginLockService loginLockService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminLoginVO login(AdminLoginRequest req) {
        String username = req.getUsername() != null ? req.getUsername().trim() : "";
        if (username.isEmpty()) {
            throw new BusinessException(400, "账号不能为空");
        }

        loginLockService.ensureNotLocked(LoginLockService.SCENE_ADMIN, username);

        SysUser user = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .last("LIMIT 1"));

        boolean passwordOk = user != null
                && passwordEncoder.matches(req.getPassword(), user.getPasswordHash());

        if (!passwordOk) {
            loginLockService.onFailure(LoginLockService.SCENE_ADMIN, username);
            throw new BusinessException(401, "账号或密码错误");
        }

        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }

        loginLockService.onSuccess(LoginLockService.SCENE_ADMIN, username);

        SysRole role = sysRoleMapper.selectById(user.getRoleId());
        Set<String> permissions = adminPermissionService.parsePermissions(
                role != null ? role.getPermissions() : null);
        String token = jwtUtils.createAdminToken(user.getId(), user.getRoleId(),
                TokenVersionSupport.current(user.getTokenVersion()));
        return AdminLoginVO.builder()
                .token(token)
                .adminId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .roleId(user.getRoleId())
                .roleName(role != null ? role.getRoleName() : "")
                .permissions(permissions)
                .mustChangePassword(user.getMustChangePassword() != null && user.getMustChangePassword() == 1)
                .build();
    }

    /** 校验原密码后更新，并清除 must_change_password 标记 */
    @Transactional
    public AdminLoginVO changePassword(Long adminId, String oldPassword, String newPassword) {
        if (oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BusinessException(400, "请填写原密码与新密码");
        }
        AdminPasswordPolicy.validate(newPassword);
        if (oldPassword.equals(newPassword)) {
            throw new BusinessException(400, "新密码不能与原密码相同");
        }

        SysUser user = sysUserMapper.selectById(adminId);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(403, "账号不可用");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException(400, "原密码不正确");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(0);
        user.setTokenVersion(TokenVersionSupport.bump(user.getTokenVersion()));
        sysUserMapper.updateById(user);

        SysRole role = sysRoleMapper.selectById(user.getRoleId());
        Set<String> permissions = adminPermissionService.parsePermissions(
                role != null ? role.getPermissions() : null);
        String token = jwtUtils.createAdminToken(user.getId(), user.getRoleId(),
                TokenVersionSupport.current(user.getTokenVersion()));
        return AdminLoginVO.builder()
                .token(token)
                .adminId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .roleId(user.getRoleId())
                .roleName(role != null ? role.getRoleName() : "")
                .permissions(permissions)
                .mustChangePassword(false)
                .build();
    }
}
