package com.shuyuan.backend.util;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 管理后台 RBAC 权限目录（与前端权限矩阵一致） */
public final class AdminPermissionCatalog {

    private AdminPermissionCatalog() {
    }

    public static final String SUPER = "admin:super";

    public static List<Map<String, Object>> groups() {
        return List.of(
                group("系统管理", List.of(
                        entry(SUPER, "超级管理员（全部权限）")
                )),
                group("新闻", List.of(
                        entry("news:read", "查看新闻"),
                        entry("news:write", "编辑新闻"),
                        entry("news:publish", "发布/下架新闻")
                )),
                group("展馆与文创", List.of(
                        entry("hall:read", "查看展馆、文创"),
                        entry("hall:write", "编辑展馆、文创"),
                        entry("hall:publish", "上架/下架展馆、文创")
                )),
                group("课程与资源", List.of(
                        entry("course:read", "查看课程、资源"),
                        entry("course:write", "编辑课程、资源"),
                        entry("course:publish", "上架/下架课程、资源")
                )),
                group("活动报名", List.of(
                        entry("enroll:read", "查看活动与报名"),
                        entry("enroll:export", "导出报名 Excel")
                )),
                group("分类与统计", List.of(
                        entry("category:read", "查看分类"),
                        entry("category:write", "编辑分类"),
                        entry("stats:view", "查看数据看板")
                ))
        );
    }

    public static List<String> allKeys() {
        return groups().stream()
                .flatMap(g -> ((List<Map<String, Object>>) g.get("permissions")).stream())
                .map(p -> (String) p.get("key"))
                .filter(k -> !SUPER.equals(k))
                .toList();
    }

    private static Map<String, Object> group(String name, List<Map<String, String>> permissions) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("group", name);
        m.put("permissions", permissions);
        return m;
    }

    private static Map<String, String> entry(String key, String label) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        return m;
    }
}
