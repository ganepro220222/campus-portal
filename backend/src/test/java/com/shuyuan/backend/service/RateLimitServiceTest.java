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

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
    void check_skipsWhenDisabled() {
        properties.getRateLimit().setEnabled(false);
        rateLimitService.checkIp("login", "127.0.0.1", 10, Duration.ofMinutes(1));
        verify(valueOps, never()).increment(anyString());
    }
}
