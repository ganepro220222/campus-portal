package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.PointRecord;
import com.shuyuan.backend.entity.PointRule;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.PointRecordMapper;
import com.shuyuan.backend.mapper.PointRuleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 积分规则触发与每日上限控制（docs Phase 4 积分与徽章）
 * <p>{@link #award(Long, String)} 仅做「每日次数」限制（Redis），remark 为空，不做对象级幂等。
 * 对象级幂等请使用 {@link #awardCourseComplete(Long, Long)} 或带非空 remark 的专用方法。
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
     * 按 action 加分（每日上限），不做对象级幂等。
     * remark 为 null，MySQL 唯一键不约束多条相同 action 流水。
     */
    @Transactional
    public void award(Long memberId, String action) {
        awardWithRemark(memberId, action, null, false);
    }

    /** 课程完成积分：每用户每课程仅奖励一次（remark=course:{id} + DB 唯一键） */
    @Transactional
    public void awardCourseComplete(Long memberId, Long courseId) {
        if (memberId == null || courseId == null) {
            return;
        }
        String remark = "course:" + courseId;
        Long prior = pointRecordMapper.selectCount(new LambdaQueryWrapper<PointRecord>()
                .eq(PointRecord::getMemberId, memberId)
                .eq(PointRecord::getAction, "complete_course")
                .eq(PointRecord::getRemark, remark));
        if (prior != null && prior > 0) {
            return;
        }
        awardWithRemark(memberId, "complete_course", remark, true);
    }

    private void awardWithRemark(Long memberId, String action, String remark, boolean idempotentByRemark) {
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

        QuotaHolder quota = new QuotaHolder(memberId, action);
        registerQuotaReleaseOnRollback(quota);

        PointRecord record = new PointRecord();
        record.setMemberId(memberId);
        record.setAction(action);
        record.setPoints(rule.getPoints());
        record.setRemark(remark);
        record.setCreatedAt(LocalDateTime.now());
        try {
            pointRecordMapper.insert(record);
            memberMapper.addPointsDelta(memberId, rule.getPoints());
            badgeGrantService.checkAndGrant(memberId);
        } catch (DataIntegrityViolationException ex) {
            quota.releaseOnce();
            if (idempotentByRemark) {
                return;
            }
            throw ex;
        } catch (RuntimeException ex) {
            quota.releaseOnce();
            throw ex;
        }
    }

    private void registerQuotaReleaseOnRollback(QuotaHolder quota) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    quota.releaseOnce();
                }
            }
        });
    }

    /** Redis 计数每日触发次数，超出上限则回退计数并返回 false */
    boolean tryConsumeDailyQuota(Long memberId, String action, int dailyLimit) {
        String key = dailyKey(memberId, action);
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

    void releaseDailyQuota(Long memberId, String action) {
        redis.opsForValue().decrement(dailyKey(memberId, action));
    }

    private String dailyKey(Long memberId, String action) {
        return DAILY_KEY_PREFIX + memberId + ":" + action + ":" + LocalDate.now();
    }

    private Duration ttlUntilTomorrow() {
        LocalDateTime end = LocalDate.now().plusDays(1).atStartOfDay();
        Duration d = Duration.between(LocalDateTime.now(), end);
        return d.isNegative() || d.isZero() ? Duration.ofHours(24) : d;
    }

    private final class QuotaHolder {
        private final Long memberId;
        private final String action;
        private boolean released;

        QuotaHolder(Long memberId, String action) {
            this.memberId = memberId;
            this.action = action;
        }

        void releaseOnce() {
            if (!released) {
                releaseDailyQuota(memberId, action);
                released = true;
            }
        }
    }
}
