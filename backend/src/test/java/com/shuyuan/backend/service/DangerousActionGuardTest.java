package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 高危操作的二次密码确认。
 *
 * <p>这里最要紧的一条是「密码打错不能把人踢下线」：管理后台的请求拦截器把 401 一律当成
 * 登录过期处理，会清会话并跳回登录页。确认框里手滑一次就被踢出后台，是不可接受的。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DangerousActionGuardTest {

    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private LoginLockService loginLockService;

    @InjectMocks
    private DangerousActionGuard guard;

    private SysUser admin(String rawPassword) {
        SysUser u = new SysUser();
        u.setId(1L);
        u.setUsername("admin");
        u.setStatus(1);
        u.setPasswordHash(new BCryptPasswordEncoder().encode(rawPassword));
        when(adminPermissionService.requireAdminId()).thenReturn(1L);
        when(sysUserMapper.selectById(1L)).thenReturn(u);
        return u;
    }

    @Test
    void 密码正确时放行() {
        admin("Admin@123");
        guard.verifyCurrentAdminPassword("Admin@123");
    }

    @Test
    void 密码错误抛400而不是401() {
        admin("Admin@123");
        when(loginLockService.registerFailure(anyString(), anyString()))
                .thenReturn(new LoginLockService.FailureState(false, 4, 5));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> guard.verifyCurrentAdminPassword("wrong"));

        // 401 会被前端拦截器当成登录过期：清会话 + 跳登录页。
        // 在删除确认框里打错一次密码就被踢出后台，是不能接受的。
        assertEquals(400, ex.getCode(), "高危密码校验失败必须是 400，不能复用登录的 401");
        assertTrue(ex.getMessage().startsWith("管理员密码不正确"), ex.getMessage());
    }

    @Test
    void 未填密码直接拒绝且不去查库() {
        when(adminPermissionService.requireAdminId()).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> guard.verifyCurrentAdminPassword("  "));

        assertEquals(400, ex.getCode());
        verify(sysUserMapper, never()).selectById(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void 账号被停用时拒绝() {
        SysUser u = admin("Admin@123");
        u.setStatus(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> guard.verifyCurrentAdminPassword("Admin@123"));

        assertEquals(403, ex.getCode());
    }

    /**
     * 高危确认的失败计数不能记在登录那把锁上。
     *
     * <p>共用的话，确认框里连打错 5 次就把后台登录锁 5 分钟——
     * 惩罚落在一个已经登录、且已经通过 admin:super 校验的人身上，说不通。
     */
    @Test
    void 失败计数不落在登录锁上() {
        admin("Admin@123");
        when(loginLockService.registerFailure(anyString(), anyString()))
                .thenReturn(new LoginLockService.FailureState(false, 4, 5));

        assertThrows(BusinessException.class, () -> guard.verifyCurrentAdminPassword("wrong"));

        // onFailure 自己会抛 401，非登录场景一律不许用它
        verify(loginLockService, never()).onFailure(anyString(), anyString());
        verify(loginLockService).registerFailure(LoginLockService.SCENE_ADMIN_DANGER, "admin");
        verify(loginLockService).ensureNotLocked(LoginLockService.SCENE_ADMIN_DANGER, "admin");
    }

    /** 连续打错到上限时给 429（拦截器只提示、不清会话），而不是把人踢下线 */
    @Test
    void 连续错到上限给429而不是踢下线() {
        admin("Admin@123");
        when(loginLockService.registerFailure(anyString(), anyString()))
                .thenReturn(new LoginLockService.FailureState(true, 0, 5));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> guard.verifyCurrentAdminPassword("wrong"));

        assertEquals(429, ex.getCode());
    }

    @Test
    void 密码正确时只清高危场景的计数() {
        admin("Admin@123");

        guard.verifyCurrentAdminPassword("Admin@123");

        verify(loginLockService).onSuccess(LoginLockService.SCENE_ADMIN_DANGER, "admin");
        verify(loginLockService, never()).onSuccess(LoginLockService.SCENE_ADMIN, "admin");
    }
}
