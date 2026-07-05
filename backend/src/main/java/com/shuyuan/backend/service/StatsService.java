package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 客户端活跃与 DAU 统计（Redis 集合，供 Phase 6 定时任务落库）
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private static final String DAU_KEY_PREFIX = "dau:";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final StringRedisTemplate redis;

    /** 记录当日活跃用户（小程序 onShow 且已登录时调用） */
    public void trackDailyActive() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            return;
        }
        String key = DAU_KEY_PREFIX + LocalDate.now().format(DATE_FMT);
        Long added = redis.opsForSet().add(key, String.valueOf(memberId));
        if (added != null && added > 0) {
            redis.expire(key, Duration.ofDays(2));
        }
    }
}
