package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class BoundedTtlCacheTest {

    @Test
    void evictsOldestWhenExceedingMaxSize() {
        BoundedTtlCache<String, String> cache = new BoundedTtlCache<>(2, 60_000);
        cache.put("a", "1");
        cache.put("b", "2");
        cache.put("c", "3");
        assertEquals(2, cache.size());
        assertNull(cache.get("a"));
        assertEquals("2", cache.get("b"));
        assertEquals("3", cache.get("c"));
    }
}
