package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminRoleSaveRequest;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.util.AdminPermissionCatalog;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** 管理后台角色与权限矩阵：内置超管角色权限不可降级 */
@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private static final long BUILTIN_SUPER_ROLE_ID = 1L;

    private final SysRoleMapper sysRoleMapper;
    private final SysUserMapper sysUserMapper;
    private final AdminPermissionService adminPermissionService;
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> list() {
        adminPermissionService.require("admin:super");
        Map<Long, Long> userCounts = sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>())
                .stream()
                .collect(Collectors.groupingBy(SysUser::getRoleId, Collectors.counting()));
        return sysRoleMapper.selectList(new LambdaQueryWrapper<SysRole>().orderByAsc(SysRole::getId))
                .stream()
                .map(role -> toVo(role, userCounts.getOrDefault(role.getId(), 0L)))
                .toList();
    }

    public List<Map<String, Object>> permissionCatalog() {
        adminPermissionService.require("admin:super");
        return AdminPermissionCatalog.groups();
    }

    @Transactional
    public Map<String, Object> create(AdminRoleSaveRequest req) {
        adminPermissionService.require("admin:super");
        validateRequest(req);
        ensureUniqueName(req.getRoleName().trim(), null);
        SysRole role = new SysRole();
        role.setRoleName(req.getRoleName().trim());
        role.setPermissions(serializePermissions(normalizePermissions(req.getPermissions())));
        sysRoleMapper.insert(role);
        return toVo(sysRoleMapper.selectById(role.getId()), 0L);
    }

    /** 更新角色；超管角色始终保留 admin:super 全集 */
    @Transactional
    public Map<String, Object> update(Long id, AdminRoleSaveRequest req) {
        adminPermissionService.require("admin:super");
        SysRole role = requireRole(id);
        validateRequest(req);
        ensureUniqueName(req.getRoleName().trim(), id);
        role.setRoleName(req.getRoleName().trim());
        if (id == BUILTIN_SUPER_ROLE_ID) {
            role.setPermissions(serializePermissions(Set.of(AdminPermissionCatalog.SUPER)));
        } else {
            role.setPermissions(serializePermissions(normalizePermissions(req.getPermissions())));
        }
        sysRoleMapper.updateById(role);
        long users = countUsers(id);
        return toVo(sysRoleMapper.selectById(id), users);
    }

    @Transactional
    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        if (id == BUILTIN_SUPER_ROLE_ID) {
            throw new BusinessException(400, "内置超级管理员角色不可删除");
        }
        requireRole(id);
        long users = countUsers(id);
        if (users > 0) {
            throw new BusinessException(400, "该角色下仍有 " + users + " 个账号，请先调整账号角色");
        }
        sysRoleMapper.deleteById(id);
    }

    private SysRole requireRole(Long id) {
        SysRole role = sysRoleMapper.selectById(id);
        if (role == null) {
            throw new BusinessException(404, "角色不存在");
        }
        return role;
    }

    private void validateRequest(AdminRoleSaveRequest req) {
        if (req.getRoleName() == null || req.getRoleName().isBlank()) {
            throw new BusinessException(400, "角色名称不能为空");
        }
        if (req.getPermissions() == null || req.getPermissions().isEmpty()) {
            throw new BusinessException(400, "请至少勾选一项权限");
        }
    }

    private void ensureUniqueName(String name, Long excludeId) {
        LambdaQueryWrapper<SysRole> qw = new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getRoleName, name);
        if (excludeId != null) {
            qw.ne(SysRole::getId, excludeId);
        }
        if (sysRoleMapper.selectCount(qw) > 0) {
            throw new BusinessException(400, "角色名称已存在");
        }
    }

    private Set<String> normalizePermissions(List<String> permissions) {
        Set<String> allowed = new HashSet<>(AdminPermissionCatalog.allKeys());
        allowed.add(AdminPermissionCatalog.SUPER);
        Set<String> normalized = new HashSet<>();
        for (String p : permissions) {
            if (p == null || p.isBlank()) {
                continue;
            }
            String key = p.trim();
            if (!allowed.contains(key)) {
                throw new BusinessException(400, "无效权限：" + key);
            }
            if (AdminPermissionCatalog.SUPER.equals(key)) {
                return Set.of(AdminPermissionCatalog.SUPER);
            }
            normalized.add(key);
        }
        if (normalized.isEmpty()) {
            throw new BusinessException(400, "请至少勾选一项权限");
        }
        return normalized;
    }

    private String serializePermissions(Set<String> permissions) {
        try {
            return objectMapper.writeValueAsString(permissions.stream().sorted().toList());
        } catch (Exception e) {
            throw new BusinessException(500, "权限序列化失败");
        }
    }

    private long countUsers(Long roleId) {
        return sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>().eq(SysUser::getRoleId, roleId));
    }

    private Map<String, Object> toVo(SysRole role, long userCount) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", role.getId());
        m.put("roleName", role.getRoleName());
        m.put("permissions", adminPermissionService.parsePermissions(role.getPermissions()));
        m.put("userCount", userCount);
        m.put("builtin", role.getId() == BUILTIN_SUPER_ROLE_ID);
        m.put("updateTime", FormatUtils.formatDateTime(role.getUpdateTime()));
        return m;
    }
}
