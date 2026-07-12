package com.shuyuan.backend.config;

import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefaultAdminStartupGuardTest {

    private static final String DEFAULT_ADMIN_HASH =
            "$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm";

    @Mock
    private Environment environment;
    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private ApplicationArguments applicationArguments;

    @InjectMocks
    private DefaultAdminStartupGuard guard;

    @Test
    void requiresDefaultAdminGuard_matchesGuardedProfiles() {
        assertTrue(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"prod"}));
        assertTrue(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"staging"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"dev"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[] {"docker", "test"}));
        assertFalse(DefaultAdminStartupGuard.requiresDefaultAdminGuard(new String[0]));
    }

    @Test
    void run_prodDefaultAdminPassword_blocksStartup() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        when(sysUserMapper.selectOne(any())).thenReturn(activeAdmin(DEFAULT_ADMIN_HASH));

        assertThrows(IllegalStateException.class, () -> guard.run(applicationArguments));
    }

    @Test
    void run_stagingDefaultAdminPassword_blocksStartup() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"staging"});
        when(sysUserMapper.selectOne(any())).thenReturn(activeAdmin(DEFAULT_ADMIN_HASH));

        assertThrows(IllegalStateException.class, () -> guard.run(applicationArguments));
    }

    @Test
    void run_devDefaultAdminPassword_allowsStartup() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});

        assertDoesNotThrow(() -> guard.run(applicationArguments));
        verify(sysUserMapper, never()).selectOne(any());
    }

    @Test
    void run_prodWithoutEnabledAdmin_allowsStartup() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        when(sysUserMapper.selectOne(any())).thenReturn(null);

        assertDoesNotThrow(() -> guard.run(applicationArguments));
    }

    @Test
    void run_prodAdminWithCustomPassword_allowsStartup() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        String customHash = new BCryptPasswordEncoder().encode("CustomPass123456");
        when(sysUserMapper.selectOne(any())).thenReturn(activeAdmin(customHash));

        assertDoesNotThrow(() -> guard.run(applicationArguments));
    }

    private static SysUser activeAdmin(String passwordHash) {
        SysUser user = new SysUser();
        user.setId(1L);
        user.setUsername(DefaultAdminStartupGuard.DEFAULT_ADMIN_USERNAME);
        user.setStatus(1);
        user.setPasswordHash(passwordHash);
        return user;
    }
}
