package com.shuyuan.backend.config;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

/**
 * staging/prod 部署安全配置校验（纯逻辑，便于单测）。
 */
public final class DeploymentSecurityRules {

    public static final String DEV_JWT_SECRET_YAML = "shuyuan-dev-jwt-secret-change-in-prod";
    public static final String DEV_JWT_SECRET_DEFAULT = "shuyuan-dev-jwt-secret";
    private static final int MIN_JWT_SECRET_LENGTH = 32;

    private static final Set<String> DEV_JWT_SECRETS = Set.of(
            DEV_JWT_SECRET_YAML,
            DEV_JWT_SECRET_DEFAULT
    );

    private static final Set<String> GUARDED_PROFILES = Set.of("prod", "staging");

    private DeploymentSecurityRules() {
    }

    public static boolean requiresGuardedValidation(String[] activeProfiles) {
        if (activeProfiles == null || activeProfiles.length == 0) {
            return false;
        }
        for (String profile : activeProfiles) {
            if (GUARDED_PROFILES.contains(profile.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    public static void validateGuardedDeployment(String[] activeProfiles,
                                                 String jwtSecret,
                                                 boolean wxDevMode,
                                                 String wxAppId,
                                                 String wxSecret) {
        if (!requiresGuardedValidation(activeProfiles)) {
            return;
        }
        validateJwtSecret(jwtSecret);
        if (wxDevMode) {
            throw new IllegalStateException(
                    "生产/预发环境禁止 shuyuan.wx.dev-mode=true，请设置 WX 凭证并关闭 dev-mode");
        }
        boolean prod = Arrays.stream(activeProfiles)
                .anyMatch(p -> "prod".equalsIgnoreCase(p));
        if (prod) {
            validateWxCredentials(wxAppId, wxSecret);
        }
    }

    static void validateJwtSecret(String jwtSecret) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("生产/预发环境必须配置 JWT_SECRET（shuyuan.jwt.secret）");
        }
        String trimmed = jwtSecret.trim();
        if (trimmed.length() < MIN_JWT_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "生产/预发环境 JWT_SECRET 长度至少 " + MIN_JWT_SECRET_LENGTH + " 字符");
        }
        if (DEV_JWT_SECRETS.contains(trimmed)) {
            throw new IllegalStateException("生产/预发环境禁止使用开发默认 JWT_SECRET");
        }
    }

    static void validateWxCredentials(String wxAppId, String wxSecret) {
        if (wxAppId == null || wxAppId.isBlank()) {
            throw new IllegalStateException("生产环境必须配置 WX_APPID");
        }
        if (wxSecret == null || wxSecret.isBlank()) {
            throw new IllegalStateException("生产环境必须配置 WX_SECRET");
        }
    }
}
