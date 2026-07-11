package com.shuyuan.backend.service;

import com.shuyuan.backend.mapper.NewsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

/**
 * 浏览量 Redis 计数：INCR + 30 分钟去重，定时批量落库（docs Phase 6）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ViewCountService {

    private static final String VIEW_KEY_PREFIX = "view:";
    private static final String DEDUP_KEY_PREFIX = "viewed:";
    private static final Duration DEDUP_TTL = Duration.ofMinutes(30);

    private final StringRedisTemplate redis;
    private final NewsMapper newsMapper;

    /**
     * 记录一次浏览（同一用户/IP 30 分钟内不重复计数）
     *
     * @return 是否新增了计数
     */
    public boolean recordView(String type, Long id, Long memberId, String clientIp) {
        if (type == null || type.isBlank() || id == null || id <= 0) {
            return false;
        }
        String viewerKey = buildViewerKey(memberId, clientIp);
        String dedupKey = DEDUP_KEY_PREFIX + viewerKey + ":" + type + ":" + id;
        Boolean firstView = redis.opsForValue().setIfAbsent(dedupKey, "1", DEDUP_TTL);
        if (!Boolean.TRUE.equals(firstView)) {
            return false;
        }
        redis.opsForValue().increment(viewKey(type, id));
        return true;
    }

    /** 展示用浏览量 = MySQL 基线 + Redis 待落库增量 */
    public int getDisplayCount(String type, Long id, int dbBase) {
        if (type == null || type.isBlank() || id == null || id <= 0) {
            return dbBase;
        }
        String pending = redis.opsForValue().get(viewKey(type, id));
        if (pending == null || pending.isBlank()) {
            return dbBase;
        }
        try {
            return dbBase + Integer.parseInt(pending);
        } catch (NumberFormatException e) {
            log.warn("浏览量 Redis 值非法：{}={}", viewKey(type, id), pending);
            return dbBase;
        }
    }

    /** 将 Redis 中待落库的浏览量增量批量写入 MySQL */
    public int flushPendingCounts() {
        Set<String> keys = redis.keys(VIEW_KEY_PREFIX + "*");
        if (keys == null || keys.isEmpty()) {
            return 0;
        }
        int flushed = 0;
        for (String key : keys) {
            if (!key.startsWith(VIEW_KEY_PREFIX)) {
                continue;
            }
            String deltaStr = redis.opsForValue().getAndDelete(key);
            if (deltaStr == null || deltaStr.isBlank()) {
                continue;
            }
            long delta;
            try {
                delta = Long.parseLong(deltaStr);
            } catch (NumberFormatException e) {
                log.warn("跳过非法浏览量键：{}={}", key, deltaStr);
                continue;
            }
            if (delta <= 0) {
                continue;
            }
            ViewKey parsed = parseViewKey(key);
            if (parsed == null) {
                log.warn("跳过无法解析的浏览量键：{}", key);
                continue;
            }
            if (applyFlush(parsed.type(), parsed.id(), delta)) {
                flushed++;
            }
        }
        return flushed;
    }

    private boolean applyFlush(String type, Long id, long delta) {
        if ("news".equals(type)) {
            int rows = newsMapper.incrementViewCount(id, delta);
            return rows > 0;
        }
        log.warn("暂不支持的浏览量落库类型：{}:{}", type, id);
        return false;
    }

    static String buildViewerKey(Long memberId, String clientIp) {
        if (memberId != null && memberId > 0) {
            return "m:" + memberId;
        }
        if (clientIp != null && !clientIp.isBlank()) {
            return "ip:" + clientIp.trim();
        }
        return "anon";
    }

    static String viewKey(String type, Long id) {
        return VIEW_KEY_PREFIX + type + ":" + id;
    }

    static ViewKey parseViewKey(String key) {
        if (key == null || !key.startsWith(VIEW_KEY_PREFIX)) {
            return null;
        }
        String rest = key.substring(VIEW_KEY_PREFIX.length());
        int colon = rest.lastIndexOf(':');
        if (colon <= 0 || colon >= rest.length() - 1) {
            return null;
        }
        String type = rest.substring(0, colon);
        try {
            long id = Long.parseLong(rest.substring(colon + 1));
            return new ViewKey(type, id);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    record ViewKey(String type, Long id) {}
}
