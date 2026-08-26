package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * 登录失败计数与锁定（Redis）
 * 对照交付标准 §2.1：连续 5 次错误锁定 5 分钟
 */
@Service
@RequiredArgsConstructor
public class LoginLockService {

    private static final String FAIL_PREFIX = "login:fail:";
    private static final String LOCK_PREFIX = "login:lock:";

    /** 场景：member=学号登录，admin=管理后台 */
    public static final String SCENE_MEMBER = "member";
    public static final String SCENE_ADMIN = "admin";
    /**
     * 高危操作的二次密码确认，与登录分开计数。
     *
     * <p>共用一把锁的话，删除确认框里连打错几次就会把后台登录一起锁掉——
     * 惩罚落在一个已经登录、且已通过 admin:super 校验的人身上，说不通。
     */
    public static final String SCENE_ADMIN_DANGER = "admin-danger";

    private final StringRedisTemplate redis;
    private final ShuyuanProperties properties;

    /** 登录前检查是否处于锁定状态 */
    public void ensureNotLocked(String scene, String account) {
        String lockKey = lockKey(scene, account);
        if (!Boolean.TRUE.equals(redis.hasKey(lockKey))) {
            return;
        }
        long seconds = redis.getExpire(lockKey, TimeUnit.SECONDS);
        throw new BusinessException(429, "账号已锁定，请" + formatWaitHint(seconds) + "后再试");
    }

    /** 登录成功后清除失败计数 */
    public void onSuccess(String scene, String account) {
        redis.delete(failKey(scene, account));
        redis.delete(lockKey(scene, account));
    }

    /** 一次失败之后的状态：是否刚触发锁定、还剩几次可试 */
    public record FailureState(boolean locked, int remaining, int lockMinutes) {
    }

    /**
     * 记一次失败：累加计数，达到上限则锁定。**不抛异常**。
     *
     * <p>登录之外的场景请用这个，然后抛自己的错误码。绝不要复用 {@link #onFailure}——
     * 它抛的是 401，而管理后台的请求拦截器把 401 一律当成登录过期：清会话、跳登录页。
     * 在删除确认框里打错一次密码就被踢出后台，是不能接受的。
     */
    public FailureState registerFailure(String scene, String account) {
        int maxFail = properties.getLogin().getMaxFailAttempts();
        int lockMinutes = properties.getLogin().getLockMinutes();
        int failWindowMinutes = properties.getLogin().getFailWindowMinutes();

        String failKey = failKey(scene, account);
        Long count = redis.opsForValue().increment(failKey);
        if (count != null && count == 1) {
            redis.expire(failKey, Duration.ofMinutes(failWindowMinutes));
        }

        if (count != null && count >= maxFail) {
            redis.opsForValue().set(lockKey(scene, account), "1", Duration.ofMinutes(lockMinutes));
            redis.delete(failKey);
            return new FailureState(true, 0, lockMinutes);
        }

        int remaining = maxFail - (count != null ? count.intValue() : 0);
        return new FailureState(false, remaining, lockMinutes);
    }

    /**
     * 登录失败：累加计数，达到上限则锁定
     * @throws BusinessException 401 密码错误或 429 刚触发锁定
     */
    public void onFailure(String scene, String account) {
        FailureState state = registerFailure(scene, account);
        if (state.locked()) {
            throw new BusinessException(429,
                    "连续登录失败次数过多，请" + state.lockMinutes() + "分钟后再试");
        }
        if (state.remaining() > 0) {
            throw new BusinessException(401, "账号或密码错误，还可尝试 " + state.remaining() + " 次");
        }
        throw new BusinessException(401, "账号或密码错误");
    }

    private String failKey(String scene, String account) {
        return FAIL_PREFIX + scene + ":" + normalize(account);
    }

    private String lockKey(String scene, String account) {
        return LOCK_PREFIX + scene + ":" + normalize(account);
    }

    private String normalize(String account) {
        return account == null ? "" : account.trim().toLowerCase();
    }

    private String formatWaitHint(long seconds) {
        if (seconds <= 0) {
            return "稍";
        }
        if (seconds >= 60) {
            long minutes = (seconds + 59) / 60;
            return minutes + "分钟";
        }
        return seconds + "秒";
    }
}
