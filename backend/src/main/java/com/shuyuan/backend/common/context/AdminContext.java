package com.shuyuan.backend.common.context;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 当前登录管理员上下文（请求线程内有效）
 */
public final class AdminContext {

    private static final ThreadLocal<Long> ADMIN_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> ROLE_ID = new ThreadLocal<>();
    private static final ThreadLocal<Set<String>> PERMISSIONS = new ThreadLocal<>();

    private AdminContext() {}

    public static void set(Long adminId, Long roleId, Set<String> permissions) {
        ADMIN_ID.set(adminId);
        ROLE_ID.set(roleId);
        PERMISSIONS.set(permissions == null ? Set.of() : new HashSet<>(permissions));
    }

    public static Long getAdminId() {
        return ADMIN_ID.get();
    }

    public static Long getRoleId() {
        return ROLE_ID.get();
    }

    public static Set<String> getPermissions() {
        Set<String> p = PERMISSIONS.get();
        return p == null ? Collections.emptySet() : p;
    }

    public static void clear() {
        ADMIN_ID.remove();
        ROLE_ID.remove();
        PERMISSIONS.remove();
    }
}
