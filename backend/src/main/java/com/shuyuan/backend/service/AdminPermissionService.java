package com.shuyuan.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminPermissionService {

    private final ObjectMapper objectMapper;

    /** 解析角色 permissions JSON */
    public Set<String> parsePermissions(String permissionsJson) {
        if (permissionsJson == null || permissionsJson.isBlank()) {
            return Set.of();
        }
        try {
            List<String> list = objectMapper.readValue(permissionsJson, new TypeReference<>() {});
            return Set.copyOf(list);
        } catch (Exception e) {
            return Set.of();
        }
    }

    /** 校验当前管理员是否拥有指定权限 */
    public void require(String permission) {
        Set<String> perms = AdminContext.getPermissions();
        if (perms.contains("admin:super") || perms.contains(permission)) {
            return;
        }
        throw new BusinessException(403, "无操作权限");
    }

    /** 满足任一权限即可 */
    public void requireAny(String... permissions) {
        Set<String> perms = AdminContext.getPermissions();
        if (perms.contains("admin:super")) {
            return;
        }
        for (String p : permissions) {
            if (perms.contains(p)) {
                return;
            }
        }
        throw new BusinessException(403, "无操作权限");
    }

    public Long requireAdminId() {
        Long adminId = AdminContext.getAdminId();
        if (adminId == null) {
            throw new BusinessException(401, "请先登录管理后台");
        }
        return adminId;
    }
}
