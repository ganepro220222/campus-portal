package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.springframework.util.StringUtils;

import java.util.Set;

/** 首页功能入口 path 白名单（防后台误配外链或越权路径） */
public final class NavPathPolicy {

    private static final Set<String> ALLOWED = Set.of(
            "/pages/news/index",
            "/pages/hall/index",
            "/pages/course/index",
            "/pages/activity/index",
            "/pages/profile/index",
            "/packageB/resource/list",
            "/packageA/craft/list",
            "/packageC/search/index",
            "/packageD/ai-chat/index",
            "/packageC/college/list"
    );

    private NavPathPolicy() {
    }

    public static String normalize(String path) {
        if (!StringUtils.hasText(path)) {
            throw new BusinessException(400, "请填写跳转路径");
        }
        String p = path.trim();
        if (!p.startsWith("/")) {
            p = "/" + p;
        }
        if (p.contains("?")) {
            p = p.substring(0, p.indexOf('?'));
        }
        if (!ALLOWED.contains(p)) {
            throw new BusinessException(400, "跳转路径不在允许范围内");
        }
        return p;
    }
}
