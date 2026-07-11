package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminResetPasswordRequest;
import com.shuyuan.backend.dto.AdminUserSaveRequest;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.util.AdminPasswordPolicy;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** 管理后台账号 CRUD：仅超管可操作，新建/重置密码后强制下次改密 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final long SUPER_ROLE_ID = 1L;

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final AdminPermissionService adminPermissionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public PageResult<Map<String, Object>> list(String keyword, int page, int size) {
        adminPermissionService.require("admin:super");
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .orderByDesc(SysUser::getUpdateTime);
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            qw.and(w -> w.like(SysUser::getUsername, kw).or().like(SysUser::getRealName, kw));
        }
        Page<SysUser> p = sysUserMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, SysRole> roles = sysRoleMapper.selectList(null).stream()
                .collect(Collectors.toMap(SysRole::getId, r -> r, (a, b) -> a));
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(u -> toVo(u, roles.get(u.getRoleId())))
                .toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public List<Map<String, Object>> roleOptions() {
        adminPermissionService.require("admin:super");
        return sysRoleMapper.selectList(new LambdaQueryWrapper<SysRole>().orderByAsc(SysRole::getId))
                .stream()
                .map(role -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", role.getId());
                    m.put("roleName", role.getRoleName());
                    return m;
                }).toList();
    }

    /** 新建账号；未传密码时生成临时密码并标记 must_change_password */
    @Transactional
    public Map<String, Object> create(AdminUserSaveRequest req) {
        adminPermissionService.require("admin:super");
        validateUsername(req.getUsername());
        requireRole(req.getRoleId());
        ensureUsernameUnique(req.getUsername().trim(), null);

        String plainPassword = req.getPassword();
        boolean generated = plainPassword == null || plainPassword.isBlank();
        if (generated) {
            plainPassword = AdminPasswordPolicy.generateTemporary();
        } else {
            AdminPasswordPolicy.validate(plainPassword);
        }

        SysUser user = new SysUser();
        user.setUsername(req.getUsername().trim());
        user.setPasswordHash(passwordEncoder.encode(plainPassword));
        user.setRoleId(req.getRoleId());
        user.setRealName(trim(req.getRealName()));
        user.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        user.setMustChangePassword(1);
        sysUserMapper.insert(user);

        Map<String, Object> vo = toVo(sysUserMapper.selectById(user.getId()),
                sysRoleMapper.selectById(user.getRoleId()));
        if (generated) {
            vo.put("temporaryPassword", plainPassword);
        }
        return vo;
    }

    /** 更新资料；禁止自改角色/自禁用，且须保留至少一名启用超管 */
    @Transactional
    public Map<String, Object> update(Long id, AdminUserSaveRequest req) {
        adminPermissionService.require("admin:super");
        SysUser user = requireUser(id);
        Long currentAdminId = AdminContext.getAdminId();

        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            String username = req.getUsername().trim();
            validateUsername(username);
            ensureUsernameUnique(username, id);
            user.setUsername(username);
        }
        if (req.getRoleId() != null) {
            if (id.equals(currentAdminId) && !req.getRoleId().equals(user.getRoleId())) {
                throw new BusinessException(400, "不能修改自己的角色");
            }
            if (isSuperAdmin(user) && !req.getRoleId().equals(SUPER_ROLE_ID)) {
                ensureAnotherActiveSuperAdmin(id);
            }
            requireRole(req.getRoleId());
            user.setRoleId(req.getRoleId());
        }
        if (req.getRealName() != null) {
            user.setRealName(trim(req.getRealName()));
        }
        if (req.getStatus() != null) {
            if (id.equals(currentAdminId) && req.getStatus() != 1) {
                throw new BusinessException(400, "不能禁用当前登录账号");
            }
            if (isSuperAdmin(user) && req.getStatus() != 1) {
                ensureAnotherActiveSuperAdmin(id);
            }
            user.setStatus(req.getStatus());
        }
        sysUserMapper.updateById(user);
        return toVo(sysUserMapper.selectById(id), sysRoleMapper.selectById(user.getRoleId()));
    }

    /** 重置密码并强制下次登录改密 */
    @Transactional
    public Map<String, Object> resetPassword(Long id, AdminResetPasswordRequest req) {
        adminPermissionService.require("admin:super");
        SysUser user = requireUser(id);
        String plain = req != null ? req.getNewPassword() : null;
        boolean generated = plain == null || plain.isBlank();
        if (generated) {
            plain = AdminPasswordPolicy.generateTemporary();
        } else {
            AdminPasswordPolicy.validate(plain);
        }
        user.setPasswordHash(passwordEncoder.encode(plain));
        user.setMustChangePassword(1);
        sysUserMapper.updateById(user);
        Map<String, Object> vo = toVo(sysUserMapper.selectById(id), sysRoleMapper.selectById(user.getRoleId()));
        vo.put("temporaryPassword", plain);
        return vo;
    }

    @Transactional
    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        Long currentAdminId = AdminContext.getAdminId();
        if (id.equals(currentAdminId)) {
            throw new BusinessException(400, "不能删除当前登录账号");
        }
        SysUser user = requireUser(id);
        if (isSuperAdmin(user)) {
            ensureAnotherActiveSuperAdmin(id);
        }
        sysUserMapper.deleteById(id);
    }

    private SysUser requireUser(Long id) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "管理员账号不存在");
        }
        return user;
    }

    private SysRole requireRole(Long roleId) {
        SysRole role = sysRoleMapper.selectById(roleId);
        if (role == null) {
            throw new BusinessException(400, "角色不存在");
        }
        return role;
    }

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BusinessException(400, "登录账号不能为空");
        }
        String u = username.trim();
        if (u.length() < 3 || u.length() > 50) {
            throw new BusinessException(400, "登录账号长度须为 3～50 个字符");
        }
        if (!u.matches("^[a-zA-Z0-9_.-]+$")) {
            throw new BusinessException(400, "登录账号仅支持字母、数字、下划线、点与连字符");
        }
    }

    private void ensureUsernameUnique(String username, Long excludeId) {
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username);
        if (excludeId != null) {
            qw.ne(SysUser::getId, excludeId);
        }
        if (sysUserMapper.selectCount(qw) > 0) {
            throw new BusinessException(400, "登录账号已存在");
        }
    }

    private boolean isSuperAdmin(SysUser user) {
        return user.getRoleId() != null && user.getRoleId().equals(SUPER_ROLE_ID);
    }

    private void ensureAnotherActiveSuperAdmin(Long excludeUserId) {
        long count = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getRoleId, SUPER_ROLE_ID)
                .eq(SysUser::getStatus, 1)
                .ne(SysUser::getId, excludeUserId));
        if (count < 1) {
            throw new BusinessException(400, "系统须保留至少一个启用的超级管理员账号");
        }
    }

    private String trim(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private Map<String, Object> toVo(SysUser user, SysRole role) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("username", user.getUsername());
        m.put("realName", user.getRealName());
        m.put("roleId", user.getRoleId());
        m.put("roleName", role != null ? role.getRoleName() : "");
        m.put("status", user.getStatus());
        m.put("mustChangePassword", user.getMustChangePassword() != null && user.getMustChangePassword() == 1);
        m.put("createTime", FormatUtils.formatDateTime(user.getCreateTime()));
        m.put("updateTime", FormatUtils.formatDateTime(user.getUpdateTime()));
        return m;
    }
}
