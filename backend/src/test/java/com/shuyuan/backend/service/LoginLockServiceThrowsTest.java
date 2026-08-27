package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * 钉死 {@link LoginLockService#onFailure} 的一个容易踩的性质：它自己会抛异常。
 *
 * <p>调用方写成「先 onFailure，再 throw 自己的异常」时，后一句是死代码——
 * 真正冒出去的是 onFailure 抛的 401/429。而管理后台的请求拦截器把 401
 * 一律当成登录过期：清会话、跳登录页。任何非登录场景复用它，都会把人踢下线。
 *
 * <p>这条性质在单测里很难被发现：LoginLockService 一旦被 mock，onFailure 就成了空方法，
 * 调用方后面那句自己的 throw 反而"生效"了，测试一片绿。所以这里用真实实例断言。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LoginLockServiceThrowsTest {

    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;

    private LoginLockService realService(long failCount) {
        ShuyuanProperties props = new ShuyuanProperties();
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(failCount);
        return new LoginLockService(redis, props);
    }

    @Test
    void onFailure_未达上限时抛401() {
        LoginLockService svc = realService(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> svc.onFailure(LoginLockService.SCENE_ADMIN, "admin"));

        assertEquals(401, ex.getCode(), "onFailure 抛的是 401——前端会据此清会话跳登录页");
    }

    @Test
    void onFailure_达上限时抛429并锁定() {
        ShuyuanProperties props = new ShuyuanProperties();
        LoginLockService svc = realService(props.getLogin().getMaxFailAttempts());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> svc.onFailure(LoginLockService.SCENE_ADMIN, "admin"));

        assertEquals(429, ex.getCode());
    }

    // ---------- 登录锁定的完整契约 ----------
    //
    // onFailure 原本是一整段内联逻辑，为了让高危密码确认能复用计数而不复用「抛 401」，
    // 被拆成 registerFailure（返回状态、不抛）+ onFailure（照旧抛）。登录路径必须逐字不变，
    // 而这段代码此前零测试覆盖——AuthServiceTest 只把 LoginLockService mock 掉了。
    // 下面把错误码与文案钉死，作为那次拆分的等价性证明。

    @Test
    void 登录失败文案与剩余次数逐字不变() {
        ShuyuanProperties props = new ShuyuanProperties();
        int maxFail = props.getLogin().getMaxFailAttempts();

        for (long count = 1; count < maxFail; count++) {
            LoginLockService svc = realService(count);
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> svc.onFailure(LoginLockService.SCENE_MEMBER, "2024001"));
            assertEquals(401, ex.getCode());
            assertEquals("账号或密码错误，还可尝试 " + (maxFail - count) + " 次", ex.getMessage());
        }
    }

    @Test
    void 达上限时的锁定文案逐字不变() {
        ShuyuanProperties props = new ShuyuanProperties();
        LoginLockService svc = realService(props.getLogin().getMaxFailAttempts());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> svc.onFailure(LoginLockService.SCENE_ADMIN, "admin"));

        assertEquals("连续登录失败次数过多，请" + props.getLogin().getLockMinutes() + "分钟后再试",
                ex.getMessage());
    }

    /** Redis 抽风返回 null 时不能把人直接锁死，仍按「还剩满额次数」处理 */
    @Test
    void 计数拿不到时按满额剩余处理() {
        ShuyuanProperties props = new ShuyuanProperties();
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(null);
        LoginLockService svc = new LoginLockService(redis, props);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> svc.onFailure(LoginLockService.SCENE_ADMIN, "admin"));

        assertEquals(401, ex.getCode());
        assertEquals("账号或密码错误，还可尝试 " + props.getLogin().getMaxFailAttempts() + " 次",
                ex.getMessage());
    }

    /** registerFailure 与 onFailure 必须给出一致的判定，否则两条路会各说各话 */
    @Test
    void registerFailure与onFailure判定一致() {
        ShuyuanProperties props = new ShuyuanProperties();
        int maxFail = props.getLogin().getMaxFailAttempts();

        LoginLockService below = realService(1L);
        LoginLockService.FailureState s1 =
                below.registerFailure(LoginLockService.SCENE_ADMIN_DANGER, "admin");
        assertFalse(s1.locked());
        assertEquals(maxFail - 1, s1.remaining());
        assertEquals(props.getLogin().getLockMinutes(), s1.lockMinutes());

        LoginLockService atCap = realService(maxFail);
        LoginLockService.FailureState s2 =
                atCap.registerFailure(LoginLockService.SCENE_ADMIN_DANGER, "admin");
        assertTrue(s2.locked());
        assertEquals(0, s2.remaining());
    }
}
