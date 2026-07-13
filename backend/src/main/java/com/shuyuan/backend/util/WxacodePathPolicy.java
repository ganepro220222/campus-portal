package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * 小程序码 path 白名单与参数校验，防止任意 path 消耗微信配额与撑爆缓存。
 */
public final class WxacodePathPolicy {

    static final int MAX_PATH_LENGTH = 128;
    private static final Pattern ALLOWED_CHARS = Pattern.compile("^[a-zA-Z0-9_/\\-]+$");

    /** 允许生成小程序码的页面（不含 query，与海报/分享场景对齐） */
    private static final Set<String> ALLOWED_PATHS = Set.of(
            "pages/index/index",
            "pages/news/index",
            "pages/hall/index",
            "pages/course/index",
            "pages/activity/index",
            "packageA/news/detail",
            "packageA/hall/detail",
            "packageA/craft/detail",
            "packageA/craft/list",
            "packageB/course/detail",
            "packageC/about/index"
    );

    private WxacodePathPolicy() {}

    /**
     * 校验并规范化 path（去前导 /、trim）。
     * @throws BusinessException 400 非法 path
     */
    public static String validateAndNormalize(String rawPath) {
        String path = normalize(rawPath);
        if (path.length() > MAX_PATH_LENGTH) {
            throw new BusinessException(400, "页面路径过长");
        }
        if (path.contains("?") || path.contains("&") || path.contains("=")) {
            throw new BusinessException(400, "小程序码不支持 query 参数");
        }
        if (!ALLOWED_CHARS.matcher(path).matches()) {
            throw new BusinessException(400, "页面路径包含非法字符");
        }
        if (!ALLOWED_PATHS.contains(path)) {
            throw new BusinessException(400, "页面路径不在允许范围内");
        }
        return path;
    }

    static String normalize(String path) {
        if (path == null || path.isBlank()) {
            return "pages/index/index";
        }
        String p = path.trim();
        if (p.startsWith("/")) {
            p = p.substring(1);
        }
        return p;
    }

    static Set<String> allowedPaths() {
        return ALLOWED_PATHS;
    }
}
