package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
                new String[] {"http://localhost:5173"},
                CorsOriginPolicy.resolveAllowedOriginPatterns(new String[] {"staging"}, List.of()));
    }
}
