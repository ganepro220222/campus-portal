package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DefaultAdminStartupGuardTest {

    @Test
    void isProdProfile_onlyProd() {
        assertTrue(DefaultAdminStartupGuard.isProdProfile(new String[] {"prod"}));
        assertFalse(DefaultAdminStartupGuard.isProdProfile(new String[] {"staging"}));
        assertFalse(DefaultAdminStartupGuard.isProdProfile(new String[] {"dev"}));
    }
}
