package com.shuyuan.backend.service;

import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ViewCountServiceTest {

    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;
    @Mock
    private NewsMapper newsMapper;

    private ViewCountService viewCountService;

    @BeforeEach
    void setUp() {
        viewCountService = new ViewCountService(redis, newsMapper);
    }

    @Test
    void recordView_incrementsOnFirstVisit() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.setIfAbsent(eq("viewed:m:9:news:1"), eq("1"), any(Duration.class))).thenReturn(true);
        when(valueOps.increment("view:news:1")).thenReturn(1L);

        assertTrue(viewCountService.recordView("news", 1L, 9L, "127.0.0.1"));
        verify(valueOps).increment("view:news:1");
    }

    @Test
    void recordView_skipsDuplicateWithinDedupWindow() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(false);

        assertFalse(viewCountService.recordView("news", 1L, 9L, "127.0.0.1"));
        verify(valueOps, never()).increment(anyString());
    }

    @Test
    void recordView_usesIpWhenNotLoggedIn() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.setIfAbsent(eq("viewed:ip:10.0.0.2:news:2"), eq("1"), any(Duration.class))).thenReturn(true);
        when(valueOps.increment("view:news:2")).thenReturn(1L);

        assertTrue(viewCountService.recordView("news", 2L, null, "10.0.0.2"));
    }

    @Test
    void getDisplayCount_addsRedisDeltaToDbBase() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("view:news:3")).thenReturn("7");

        assertEquals(17, viewCountService.getDisplayCount("news", 3L, 10));
    }

    @Test
    void flushPendingCounts_writesNewsDeltaAndClearsKey() {
        when(redis.keys("view:*")).thenReturn(Set.of("view:news:5"));
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.getAndDelete("view:news:5")).thenReturn("4");
        when(newsMapper.incrementViewCount(5L, 4L)).thenReturn(1);

        assertEquals(1, viewCountService.flushPendingCounts());
        verify(newsMapper).incrementViewCount(5L, 4L);
    }

    @Test
    void parseViewKey_parsesTypeAndId() {
        ViewCountService.ViewKey parsed = ViewCountService.parseViewKey("view:news:42");
        assertEquals("news", parsed.type());
        assertEquals(42L, parsed.id());
        assertNull(ViewCountService.parseViewKey("viewed:m:1:news:2"));
    }

    @Test
    void buildViewerKey_prefersMemberId() {
        assertEquals("m:8", ViewCountService.buildViewerKey(8L, "1.1.1.1"));
        assertEquals("ip:1.1.1.1", ViewCountService.buildViewerKey(null, "1.1.1.1"));
    }
}
