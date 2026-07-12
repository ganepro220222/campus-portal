package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.PointRecord;
import com.shuyuan.backend.entity.PointRule;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.PointRecordMapper;
import com.shuyuan.backend.mapper.PointRuleMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {

    @Mock
    private PointRuleMapper pointRuleMapper;
    @Mock
    private PointRecordMapper pointRecordMapper;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;
    @Mock
    private BadgeGrantService badgeGrantService;

    @InjectMocks
    private PointService pointService;

    @Test
    void award_writesRecordAndUpdatesBalanceWhenWithinDailyLimit() {
        when(pointRuleMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeRule("view_news", 2, 5));
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        pointService.award(8L, "view_news");

        verify(pointRecordMapper).insert(any(PointRecord.class));
        verify(memberMapper).addPointsDelta(8L, 2);
        verify(badgeGrantService).checkAndGrant(8L);
        verify(redis).expire(anyString(), any(Duration.class));
    }

    @Test
    void award_skipsWhenDailyLimitExceeded() {
        when(pointRuleMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeRule("view_news", 2, 1));
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(2L);

        pointService.award(8L, "view_news");

        verify(pointRecordMapper, never()).insert(any(PointRecord.class));
        verify(memberMapper, never()).addPointsDelta(anyLong(), anyInt());
        verify(valueOps).decrement(anyString());
    }

    @Test
    void award_skipsWhenRuleDisabledOrMissing() {
        when(pointRuleMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        pointService.award(8L, "view_news");

        verify(redis, never()).opsForValue();
        verify(pointRecordMapper, never()).insert(any(PointRecord.class));
    }

    @Test
    void awardCurrentUser_delegatesWhenLoggedIn() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(3L);
        when(pointRuleMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeRule("view_news", 1, 3));
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        pointService.awardCurrentUser("view_news");

        ArgumentCaptor<PointRecord> captor = ArgumentCaptor.forClass(PointRecord.class);
        verify(pointRecordMapper).insert(captor.capture());
        assertEquals(3L, captor.getValue().getMemberId());
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    @Test
    void awardCourseComplete_isIdempotentPerCourse() {
        when(pointRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        pointService.awardCourseComplete(8L, 12L);

        verify(pointRuleMapper, never()).selectOne(any(LambdaQueryWrapper.class));
        verify(pointRecordMapper, never()).insert(any(PointRecord.class));
    }

    @Test
    void awardCourseComplete_writesRemarkOnce() {
        when(pointRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(pointRuleMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeRule("complete_course", 20, 1));
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        pointService.awardCourseComplete(8L, 12L);

        ArgumentCaptor<PointRecord> captor = ArgumentCaptor.forClass(PointRecord.class);
        verify(pointRecordMapper).insert(captor.capture());
        assertEquals("course:12", captor.getValue().getRemark());
    }

    private static PointRule activeRule(String action, int points, int dailyLimit) {
        PointRule rule = new PointRule();
        rule.setAction(action);
        rule.setPoints(points);
        rule.setDailyLimit(dailyLimit);
        rule.setStatus(1);
        return rule;
    }
}
