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
import static org.junit.jupiter.api.Assertions.assertThrows;
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
}
