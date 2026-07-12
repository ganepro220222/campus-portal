package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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
}
