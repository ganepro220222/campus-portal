package com.shuyuan.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * staging/prod 下 CORS 白名单策略（纯逻辑，便于单测）。
 */
public final class CorsOriginPolicy {

    private static final String[] PERMISSIVE = {"*"};
    private static final String[] STAGING_FALLBACK = {"http://localhost:5173"};

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
            return STAGING_FALLBACK;
        }
        return configured.toArray(new String[0]);
    }
}
