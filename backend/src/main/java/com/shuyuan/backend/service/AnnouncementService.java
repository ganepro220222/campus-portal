package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.entity.Announcement;
import com.shuyuan.backend.mapper.AnnouncementMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private static final String CACHE_KEY = "announcement:active";

    private final AnnouncementMapper announcementMapper;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    /** 当前有效公告（首页通知条，Redis 缓存 5 分钟） */
    public List<Map<String, Object>> listActive() {
        try {
            String cached = redis.opsForValue().get(CACHE_KEY);
            if (cached != null && !cached.isBlank()) {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("公告缓存读取失败，回退数据库: {}", e.getMessage());
        }

        List<Map<String, Object>> result = loadActiveFromDb();
        try {
            redis.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(result), 5, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("公告缓存写入失败: {}", e.getMessage());
        }
        return result;
    }

    private List<Map<String, Object>> loadActiveFromDb() {
        LocalDateTime now = LocalDateTime.now();
        List<Announcement> list = announcementMapper.selectList(new LambdaQueryWrapper<Announcement>()
                .eq(Announcement::getStatus, 1)
                .and(w -> w.isNull(Announcement::getStartTime).or().le(Announcement::getStartTime, now))
                .and(w -> w.isNull(Announcement::getEndTime).or().ge(Announcement::getEndTime, now))
                .orderByAsc(Announcement::getSort));
        return list.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("content", a.getContent());
            m.put("linkUrl", a.getLinkUrl());
            m.put("isScroll", a.getIsScroll());
            return m;
        }).toList();
    }
}
