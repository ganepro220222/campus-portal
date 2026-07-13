package com.shuyuan.backend.util;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 有界 TTL 缓存（LRU 淘汰），用于小程序码等场景避免无上限内存增长。
 */
public final class BoundedTtlCache<K, V> {

    private final int maxSize;
    private final long ttlMs;
    private final LinkedHashMap<K, Entry<V>> store;

    public BoundedTtlCache(int maxSize, long ttlMs) {
        this.maxSize = Math.max(1, maxSize);
        this.ttlMs = Math.max(1L, ttlMs);
        this.store = new LinkedHashMap<>(maxSize, 0.75f, true);
    }

    public synchronized V get(K key) {
        purgeExpired();
        Entry<V> entry = store.get(key);
        if (entry == null) {
            return null;
        }
        if (isExpired(entry)) {
            store.remove(key);
            return null;
        }
        return entry.value;
    }

    public synchronized void put(K key, V value) {
        purgeExpired();
        store.put(key, new Entry<>(value, System.currentTimeMillis() + ttlMs));
        while (store.size() > maxSize) {
            K eldest = store.keySet().iterator().next();
            store.remove(eldest);
        }
    }

    public synchronized int size() {
        purgeExpired();
        return store.size();
    }

    private void purgeExpired() {
        store.entrySet().removeIf(e -> isExpired(e.getValue()));
    }

    private boolean isExpired(Entry<V> entry) {
        return System.currentTimeMillis() >= entry.expiresAtMs;
    }

    private record Entry<V>(V value, long expiresAtMs) {}
}
