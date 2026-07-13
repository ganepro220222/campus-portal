package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsOriginPolicyTest {

    @Test
    void requiresRestrictedCors_onlyStagingOrProd() {
        assertFalse(CorsOriginPolicy.requiresRestrictedCors(new String[] {"dev"}));
        assertFalse(CorsOriginPolicy.requiresRestrictedCors(new String[] {"docker", "test"}));
        assertTrue(CorsOriginPolicy.requiresRestrictedCors(new String[] {"staging"}));
        assertTrue(CorsOriginPolicy.requiresRestrictedCors(new String[] {"prod"}));
    }

    @Test
    void resolveAllowedOriginPatterns_devUsesWildcard() {
        assertArrayEquals(new String[] {"*"},
                CorsOriginPolicy.resolveAllowedOriginPatterns(new String[] {"dev"}, List.of()));
    }

    @Test
    void resolveAllowedOriginPatterns_stagingUsesConfiguredList() {
        assertArrayEquals(
                new String[] {"https://a.example.com", "http://localhost:5173"},
                CorsOriginPolicy.resolveAllowedOriginPatterns(
                        new String[] {"staging"},
                        List.of("https://a.example.com", "http://localhost:5173")));
    }

    @Test
    void resolveAllowedOriginPatterns_stagingFallbackWhenEmpty() {
        assertArrayEquals(
                new String[0],
                CorsOriginPolicy.resolveAllowedOriginPatterns(new String[] {"staging"}, List.of()));
    }

    @Test
    void validateGuardedCorsOrigins_rejectsLocalhostOnStaging() {
        assertThrows(IllegalStateException.class, () ->
                CorsOriginPolicy.validateGuardedCorsOrigins(
                        new String[] {"staging"},
                        List.of("https://admin.example.com", "http://localhost:5173")));
    }

    @Test
    void validateGuardedCorsOrigins_rejectsPlaceholderOnProd() {
        assertThrows(IllegalStateException.class, () ->
                CorsOriginPolicy.validateGuardedCorsOrigins(
                        new String[] {"prod"},
                        List.of("https://staging.example.edu.cn")));
    }

    @Test
    void validateGuardedCorsOrigins_skipsDev() {
        assertDoesNotThrow(() ->
                CorsOriginPolicy.validateGuardedCorsOrigins(
                        new String[] {"dev"},
                        List.of("http://localhost:5173", "*")));
    }
}
