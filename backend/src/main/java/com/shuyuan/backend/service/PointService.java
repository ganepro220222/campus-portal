package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.PointRecord;
import com.shuyuan.backend.entity.PointRule;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.PointRecordMapper;
import com.shuyuan.backend.mapper.PointRuleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 积分规则触发与每日上限控制（docs Phase 4 积分与徽章）
 */
@Service
@RequiredArgsConstructor
public class PointService {

    private static final String DAILY_KEY_PREFIX = "points:daily:";

    private final PointRuleMapper pointRuleMapper;
    private final PointRecordMapper pointRecordMapper;
    private final MemberMapper memberMapper;
    private final StringRedisTemplate redis;
    private final BadgeGrantService badgeGrantService;

    /** 当前登录用户加分，未登录则忽略 */
    public void awardCurrentUser(String action) {
        Long memberId = MemberContext.getMemberId();
        if (memberId != null) {
            award(memberId, action);
        }
    }

    /**
     * 按规则为用户加分：校验启用状态、Redis 每日次数、写流水并更新余额。
     */
    @Transactional
    public void award(Long memberId, String action) {
        if (memberId == null || action == null || action.isBlank()) {
            return;
        }
        PointRule rule = pointRuleMapper.selectOne(new LambdaQueryWrapper<PointRule>()
                .eq(PointRule::getAction, action)
                .eq(PointRule::getStatus, 1)
                .last("LIMIT 1"));
        if (rule == null || rule.getPoints() == null || rule.getPoints() <= 0) {
            return;
        }
        int dailyLimit = rule.getDailyLimit() != null ? rule.getDailyLimit() : 1;
        if (!tryConsumeDailyQuota(memberId, action, dailyLimit)) {
            return;
        }

        PointRecord record = new PointRecord();
        record.setMemberId(memberId);
        record.setAction(action);
        record.setPoints(rule.getPoints());
        record.setCreatedAt(LocalDateTime.now());
        pointRecordMapper.insert(record);

        memberMapper.addPointsDelta(memberId, rule.getPoints());
        badgeGrantService.checkAndGrant(memberId);
    }

    /** Redis 计数每日触发次数，超出上限则回退计数并返回 false */
    private boolean tryConsumeDailyQuota(Long memberId, String action, int dailyLimit) {
        String key = DAILY_KEY_PREFIX + memberId + ":" + action + ":" + LocalDate.now();
        Long count = redis.opsForValue().increment(key);
        if (count == null) {
            return false;
        }
        if (count == 1) {
            redis.expire(key, ttlUntilTomorrow());
        }
        if (count > dailyLimit) {
            redis.opsForValue().decrement(key);
            return false;
        }
        return true;
    }

    private Duration ttlUntilTomorrow() {
        LocalDateTime end = LocalDate.now().plusDays(1).atStartOfDay();
        Duration d = Duration.between(LocalDateTime.now(), end);
        return d.isNegative() || d.isZero() ? Duration.ofHours(24) : d;
    }
}
