package com.shuyuan.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * staging/prod 下 CORS 白名单策略（纯逻辑，便于单测）。
 */
public final class CorsOriginPolicy {

    private static final String[] PERMISSIVE = {"*"};
    private static final String[] RESTRICTED_EMPTY = new String[0];

    private CorsOriginPolicy() {
    }

    public static boolean requiresRestrictedCors(String[] activeProfiles) {
        if (activeProfiles == null || activeProfiles.length == 0) {
            return false;
        }
        for (String profile : activeProfiles) {
            String p = profile.toLowerCase(Locale.ROOT);
            if ("prod".equals(p) || "staging".equals(p)) {
                return true;
            }
        }
        return false;
    }

    public static String[] resolveAllowedOriginPatterns(String[] activeProfiles, List<String> configured) {
        if (!requiresRestrictedCors(activeProfiles)) {
            return PERMISSIVE;
        }
        if (configured == null || configured.isEmpty()) {
            return RESTRICTED_EMPTY;
        }
        return configured.toArray(new String[0]);
    }

    /** staging/prod 同源反代且未配置分域白名单时，不暴露 CORS（浏览器不触发跨域）。 */
    public static boolean shouldRegisterCors(String[] allowedOriginPatterns) {
        return allowedOriginPatterns != null && allowedOriginPatterns.length > 0;
    }

    /**
     * Spring 禁止 allowCredentials(true) 与通配符 * 同时使用。
     * dev 本地 * 仅用于无 Cookie 的 Bearer 鉴权场景。
     */
    public static boolean allowCredentials(String[] allowedOriginPatterns) {
        if (!shouldRegisterCors(allowedOriginPatterns)) {
            return false;
        }
        return allowedOriginPatterns.length != 1 || !"*".equals(allowedOriginPatterns[0]);
    }

    public static void validateGuardedCorsOrigins(String[] activeProfiles, List<String> configured) {
        if (!requiresRestrictedCors(activeProfiles) || configured == null) {
            return;
        }
        for (String origin : configured) {
            validateSingleOriginPattern(origin);
        }
    }

    static void validateSingleOriginPattern(String origin) {
        if (origin == null || origin.isBlank()) {
            return;
        }
        String trimmed = origin.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if ("*".equals(trimmed)) {
            throw new IllegalStateException("staging/prod CORS 禁止使用通配符 *");
        }
        if (lower.contains("localhost") || lower.contains("127.0.0.1")) {
            throw new IllegalStateException("staging/prod CORS 禁止包含 localhost: " + origin);
        }
        if (lower.contains("example.edu.cn")) {
            throw new IllegalStateException("staging/prod CORS 禁止使用占位域名 example.edu.cn: " + origin);
        }
    }
}
