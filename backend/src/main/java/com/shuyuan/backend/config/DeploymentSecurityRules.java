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
    public static final String PLACEHOLDER_JWT_SECRET = "your-jwt-secret-at-least-32-chars";
    public static final String PLACEHOLDER_WX_APPID = "your-wx-appid";
    public static final String PLACEHOLDER_WX_SECRET = "your-wx-secret";
    private static final int MIN_JWT_SECRET_LENGTH = 32;

    private static final Set<String> DEV_JWT_SECRETS = Set.of(
            DEV_JWT_SECRET_YAML,
            DEV_JWT_SECRET_DEFAULT
    );

    private static final Set<String> PLACEHOLDER_VALUES = Set.of(
            PLACEHOLDER_JWT_SECRET,
            "your-db-password",
            "your-redis-password",
            PLACEHOLDER_WX_APPID,
            PLACEHOLDER_WX_SECRET
    );

    private static final Set<String> LOCAL_DB_HOSTS = Set.of(
            "localhost", "127.0.0.1", "::1", "mysql"
    );

    private static final Set<String> LOCAL_REDIS_HOSTS = Set.of(
            "localhost", "127.0.0.1", "::1", "redis"
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
        if (isPlaceholderValue(trimmed)) {
            throw new IllegalStateException("生产/预发环境禁止使用 .env.example 占位 JWT_SECRET");
        }
    }

    static void validateWxCredentials(String wxAppId, String wxSecret) {
        if (wxAppId == null || wxAppId.isBlank()) {
            throw new IllegalStateException("生产环境必须配置 WX_APPID");
        }
        if (wxSecret == null || wxSecret.isBlank()) {
            throw new IllegalStateException("生产环境必须配置 WX_SECRET");
        }
        if (isPlaceholderValue(wxAppId)) {
            throw new IllegalStateException("生产环境禁止使用 .env.example 占位 WX_APPID");
        }
        if (isPlaceholderValue(wxSecret)) {
            throw new IllegalStateException("生产环境禁止使用 .env.example 占位 WX_SECRET");
        }
    }

    static boolean isPlaceholderValue(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return PLACEHOLDER_VALUES.contains(value.trim());
    }

    static String extractJdbcHost(String datasourceUrl) {
        if (datasourceUrl == null || datasourceUrl.isBlank()) {
            return "";
        }
        String trimmed = datasourceUrl.trim();
        int schemeEnd = trimmed.indexOf("://");
        if (schemeEnd < 0) {
            return "";
        }
        String rest = trimmed.substring(schemeEnd + 3);
        if (rest.startsWith("[")) {
            int endBracket = rest.indexOf(']');
            if (endBracket > 0) {
                return rest.substring(1, endBracket).toLowerCase(Locale.ROOT);
            }
            return "";
        }
        int end = rest.length();
        int slash = rest.indexOf('/');
        if (slash >= 0) {
            end = Math.min(end, slash);
        }
        int question = rest.indexOf('?');
        if (question >= 0) {
            end = Math.min(end, question);
        }
        int colon = rest.indexOf(':');
        if (colon >= 0) {
            end = Math.min(end, colon);
        }
        return rest.substring(0, end).trim().toLowerCase(Locale.ROOT);
    }

    static boolean isLocalDbHost(String host) {
        return host != null && LOCAL_DB_HOSTS.contains(host.toLowerCase(Locale.ROOT));
    }

    static boolean isLocalRedisHost(String host) {
        return host != null && LOCAL_REDIS_HOSTS.contains(host.trim().toLowerCase(Locale.ROOT));
    }

    /**
     * dev/docker 等非 guarded profile 若连接远程 DB/Redis，拒绝启动，避免绕过 staging/prod 门禁。
     */
    public static void validateNonGuardedProfileUsesLocalInfraOnly(String[] activeProfiles,
                                                                   String datasourceUrl,
                                                                   String redisHost) {
        if (requiresGuardedValidation(activeProfiles) || hasTestProfile(activeProfiles)) {
            return;
        }
        if (!isRemoteDatasource(datasourceUrl) && !isRemoteRedis(redisHost)) {
            return;
        }
        throw new IllegalStateException(
                "检测到非 guarded profile（dev/docker/空）连接远程 DB/Redis，"
                        + "请将 SPRING_PROFILES_ACTIVE 设为 staging 或 prod；"
                        + "当前 profiles=" + Arrays.toString(activeProfiles));
    }

    static boolean hasTestProfile(String[] activeProfiles) {
        if (activeProfiles == null) {
            return false;
        }
        for (String profile : activeProfiles) {
            if ("test".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    static boolean isRemoteDatasource(String datasourceUrl) {
        String host = extractJdbcHost(datasourceUrl);
        if (host.isEmpty()) {
            return false;
        }
        return !isLocalDbHost(host);
    }

    static boolean isRemoteRedis(String redisHost) {
        if (redisHost == null || redisHost.isBlank()) {
            return false;
        }
        return !isLocalRedisHost(redisHost);
    }
}
