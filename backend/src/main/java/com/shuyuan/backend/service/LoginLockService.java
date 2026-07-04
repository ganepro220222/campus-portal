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

    /**
     * 登录失败：累加计数，达到上限则锁定
     * @throws BusinessException 401 密码错误或 429 刚触发锁定
     */
    public void onFailure(String scene, String account) {
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
            throw new BusinessException(429,
                    "连续登录失败次数过多，请" + lockMinutes + "分钟后再试");
        }

        int remaining = maxFail - (count != null ? count.intValue() : 0);
        if (remaining > 0) {
            throw new BusinessException(401, "账号或密码错误，还可尝试 " + remaining + " 次");
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
