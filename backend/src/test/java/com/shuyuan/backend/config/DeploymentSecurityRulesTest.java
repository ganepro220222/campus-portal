package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeploymentSecurityRulesTest {

    private static final String STRONG_SECRET =
            "staging-jwt-secret-with-enough-length-for-validation";

    @Test
    void requiresGuardedValidation_falseForDevProfiles() {
        assertFalse(DeploymentSecurityRules.requiresGuardedValidation(new String[] {"dev"}));
        assertFalse(DeploymentSecurityRules.requiresGuardedValidation(new String[] {"docker", "test"}));
        assertFalse(DeploymentSecurityRules.requiresGuardedValidation(new String[0]));
    }

    @Test
    void requiresGuardedValidation_trueForStagingOrProd() {
        assertTrue(DeploymentSecurityRules.requiresGuardedValidation(new String[] {"staging"}));
        assertTrue(DeploymentSecurityRules.requiresGuardedValidation(new String[] {"prod"}));
    }

    @Test
    void validateGuardedDeployment_skipsDev() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateGuardedDeployment(
                new String[] {"dev"},
                DeploymentSecurityRules.DEV_JWT_SECRET_YAML,
                true,
                "",
                ""));
    }

    @Test
    void validateGuardedDeployment_rejectsDevJwtOnStaging() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateGuardedDeployment(
                        new String[] {"staging"},
                        DeploymentSecurityRules.DEV_JWT_SECRET_YAML,
                        false,
                        "",
                        ""));
    }

    @Test
    void validateGuardedDeployment_rejectsWxDevModeOnStaging() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateGuardedDeployment(
                        new String[] {"staging"},
                        STRONG_SECRET,
                        true,
                        "",
                        ""));
    }

    @Test
    void validateGuardedDeployment_stagingAllowsMissingWxCredentials() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateGuardedDeployment(
                new String[] {"staging"},
                STRONG_SECRET,
                false,
                "",
                ""));
    }

    @Test
    void validateGuardedDeployment_prodRequiresWxCredentials() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateGuardedDeployment(
                        new String[] {"prod"},
                        STRONG_SECRET,
                        false,
                        "",
                        ""));

        assertDoesNotThrow(() -> DeploymentSecurityRules.validateGuardedDeployment(
                new String[] {"prod"},
                STRONG_SECRET,
                false,
                "wx-app-id",
                "wx-secret"));
    }

    @Test
    void validateJwtSecret_rejectsShortSecret() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateJwtSecret("too-short"));
    }

    @Test
    void validateJwtSecret_rejectsPlaceholder() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateJwtSecret(
                        DeploymentSecurityRules.PLACEHOLDER_JWT_SECRET));
    }

    @Test
    void validateWxCredentials_rejectsPlaceholder() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateWxCredentials(
                        DeploymentSecurityRules.PLACEHOLDER_WX_APPID,
                        DeploymentSecurityRules.PLACEHOLDER_WX_SECRET));
    }

    @Test
    void validateGuardedDeployment_prodRejectsPlaceholderWx() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateGuardedDeployment(
                        new String[] {"prod"},
                        STRONG_SECRET,
                        false,
                        DeploymentSecurityRules.PLACEHOLDER_WX_APPID,
                        DeploymentSecurityRules.PLACEHOLDER_WX_SECRET));
    }

    @Test
    void extractJdbcHost_parsesHostNotQueryLocalhost() {
        assertEquals("rds.aliyuncs.com",
                DeploymentSecurityRules.extractJdbcHost(
                        "jdbc:mysql://rds.aliyuncs.com:3306/shuyuan?foo=localhost"));
        assertEquals("::1",
                DeploymentSecurityRules.extractJdbcHost("jdbc:mysql://[::1]:3306/shuyuan"));
    }

    @Test
    void validateNonGuardedProfile_rejectsRemoteDbEvenWhenUrlContainsLocalhostInQuery() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                        new String[] {"dev"},
                        "jdbc:mysql://rds.aliyuncs.com:3306/shuyuan?redirect=localhost",
                        "localhost"));
    }

    @Test
    void validateNonGuardedProfile_allowsIpv6LoopbackDatasource() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                new String[] {"dev"},
                "jdbc:mysql://[::1]:3306/shuyuan",
                "localhost"));
    }

    @Test
    void validateNonGuardedProfile_allowsLocalDev() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                new String[] {"dev"},
                "jdbc:mysql://localhost:3306/shuyuan",
                "localhost"));
    }

    @Test
    void validateNonGuardedProfile_allowsDockerCompose() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                new String[] {"docker"},
                "jdbc:mysql://mysql:3306/shuyuan",
                "redis"));
    }

    @Test
    void validateNonGuardedProfile_skipsTestProfile() {
        assertDoesNotThrow(() -> DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                new String[] {"test"},
                "jdbc:mysql://rds.example.com:3306/shuyuan_test",
                "redis.example.com"));
    }

    @Test
    void validateNonGuardedProfile_rejectsRemoteDbWithDevProfile() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                        new String[] {"dev"},
                        "jdbc:mysql://rds.example.com:3306/shuyuan",
                        "localhost"));
    }

    @Test
    void validateNonGuardedProfile_rejectsRemoteRedisWithEmptyProfiles() {
        assertThrows(IllegalStateException.class, () ->
                DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                        new String[0],
                        "jdbc:mysql://localhost:3306/shuyuan",
                        "redis.prod.internal"));
    }
}
