package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DefaultAdminStartupGuardTest {

    @Test
    void requiresDefaultAdminGuard_matchesGuardedProfiles() {
        assertTrue(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"prod"}));
        assertTrue(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"staging"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"dev"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"docker", "test"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[0]));
    }
}
