package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;

    private ShuyuanProperties properties;
    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getRateLimit().setEnabled(true);
        rateLimitService = new RateLimitService(redis, properties);
    }

    @Test
    void check_allowsWithinLimit() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);
        assertDoesNotThrow(() -> rateLimitService.checkIp("login", "127.0.0.1", 10, Duration.ofMinutes(1)));
        verify(redis).expire(anyString(), eq(Duration.ofMinutes(1)));
    }

    @Test
    void check_blocksWhenExceeded() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(11L);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> rateLimitService.checkIp("login", "127.0.0.1", 10, Duration.ofMinutes(1)));
        assertEquals(429, ex.getCode());
    }

    @Test
    void check_aiDailyLimitUsesFriendlyMessage() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(21L);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> rateLimitService.checkUser("ai", 9L, 20, Duration.ofDays(1)));
        assertEquals(429, ex.getCode());
        assertEquals("今日问答次数已用完，请明天再来", ex.getMessage());
    }

    @Test
    void checkUserCalendarDay_usesDateInKey() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);
        rateLimitService.checkUserCalendarDay("ai", 5L, 20);
        verify(valueOps).increment(org.mockito.ArgumentMatchers.matches("ratelimit:ai:u:5:\\d{4}-\\d{2}-\\d{2}"));
    }

    @Test
    void getUserCalendarDayUsage_readsDatedKey() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(org.mockito.ArgumentMatchers.matches("ratelimit:ai:u:3:\\d{4}-\\d{2}-\\d{2}")))
                .thenReturn("4");
        assertEquals(4, rateLimitService.getUserCalendarDayUsage("ai", 3L));
    }

    @Test
    void check_skipsWhenDisabled() {
        properties.getRateLimit().setEnabled(false);
        rateLimitService.checkIp("login", "127.0.0.1", 10, Duration.ofMinutes(1));
        verify(valueOps, never()).increment(anyString());
    }

    @Test
    void tryAcquireUser_returnsTrueWithinLimit() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);
        assertEquals(true, rateLimitService.tryAcquireUser("course-complete", 9L, 5, Duration.ofHours(1)));
    }

    @Test
    void tryAcquireUser_returnsFalseAndRollsBackWhenExceeded() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(6L);
        assertEquals(false, rateLimitService.tryAcquireUser("course-complete", 9L, 5, Duration.ofHours(1)));
        // 回退走 Lua「存在才减」，不再裸 DECR
        verify(redis).execute(any(RedisScript.class), eq(List.of("ratelimit:course-complete:u:9")));
        verify(valueOps, never()).decrement(anyString());
    }

    // ---------- 失败退还 ----------

    /**
     * 裸 DECR 对不存在的键会新建 -1 且不带 TTL；计数已为 0 时不应再减成负数。
     * 所以退还必须走 Lua「仅当计数 &gt; 0 才 DECR」，而不是 opsForValue().decrement()。
     */
    @Test
    void refundKey_usesExistsGuardedScriptNotRawDecrement() {
        rateLimitService.refundKey("ratelimit:ai:u:5:2026-08-27");

        verify(redis).execute(any(RedisScript.class), eq(List.of("ratelimit:ai:u:5:2026-08-27")));
        verify(valueOps, never()).decrement(anyString());
    }

    @Test
    void refundKey_skipsWhenDisabledOrBlank() {
        rateLimitService.refundKey(null);
        rateLimitService.refundKey("  ");
        properties.getRateLimit().setEnabled(false);
        rateLimitService.refundKey("ratelimit:ai:u:5");

        verify(redis, never()).execute(any(RedisScript.class), anyList());
    }

    @Test
    void refundKey_sameRequestSameKeyOnlyExecutesOnce() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        try {
            rateLimitService.refundKey("ratelimit:ai:u:5:2026-08-27");
            rateLimitService.refundKey("ratelimit:ai:u:5:2026-08-27");
            verify(redis, org.mockito.Mockito.times(1)).execute(any(RedisScript.class), anyList());
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    /** 退还要拿到「本次占用的那把键」，所以计数方法必须把键回传出来 */
    @Test
    void check_returnsOccupiedKeyForRefund() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        assertEquals("ratelimit:enroll:u:9",
                rateLimitService.checkUser("enroll", 9L, 5, Duration.ofMinutes(1)));
        assertEquals("ratelimit:login:ip:127.0.0.1",
                rateLimitService.checkIp("login", "127.0.0.1", 10, Duration.ofMinutes(1)));
    }

    @Test
    void check_returnsNullWhenNotCounted() {
        properties.getRateLimit().setEnabled(false);
        assertNull(rateLimitService.checkUser("enroll", 9L, 5, Duration.ofMinutes(1)));
        assertNull(rateLimitService.checkUser("enroll", null, 5, Duration.ofMinutes(1)));
        assertNull(rateLimitService.checkUserCalendarDay("ai", null, 20));
    }

    // ---------- 超限文案 ----------

    /**
     * 后台 AI 辅助原来落在兜底分支上，管理员看到的是「操作过于频繁，请稍后再试」——
     * 那句话的意思是歇一会儿就能用，而真实情况是今天的额度没了。
     */
    @Test
    void check_aiPolishSaysDailyQuotaWithTheNumber() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(61L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> rateLimitService.checkUserCalendarDay(RateLimitService.SCENE_AI_POLISH, 7L, 60));

        assertEquals(429, ex.getCode());
        assertEquals("今日 AI 文案辅助次数已用完（每人每天 60 次），请明天再试", ex.getMessage());
    }

    @Test
    void check_othersKeepGenericMessage() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(11L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> rateLimitService.checkIp("enroll", "127.0.0.1", 10, Duration.ofMinutes(1)));

        assertEquals("操作过于频繁，请稍后再试", ex.getMessage());
    }
}
