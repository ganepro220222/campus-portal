package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Badge;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberBadge;
import com.shuyuan.backend.mapper.BadgeMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.mapper.EventLogMapper;
import com.shuyuan.backend.mapper.MemberBadgeMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.PointRecordMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BadgeGrantServiceTest {

    @Mock
    private BadgeMapper badgeMapper;
    @Mock
    private MemberBadgeMapper memberBadgeMapper;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private PointRecordMapper pointRecordMapper;
    @Mock
    private EnrollMapper enrollMapper;
    @Mock
    private EventLogMapper eventLogMapper;

    @InjectMocks
    private BadgeGrantService badgeGrantService;

    @Test
    void checkAndGrant_ignoresDuplicateKeyOnConcurrentInsert() {
        Member member = new Member();
        member.setId(8L);
        member.setPoints(50);
        when(memberMapper.selectById(8L)).thenReturn(member);
        when(memberBadgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(badgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(pointsBadge(50)));
        doThrow(new DuplicateKeyException("PRIMARY"))
                .when(memberBadgeMapper).insert(any(MemberBadge.class));

        assertDoesNotThrow(() -> badgeGrantService.checkAndGrant(8L));

        verify(memberBadgeMapper, times(1)).insert(any(MemberBadge.class));
    }

    private static Badge pointsBadge(int threshold) {
        Badge badge = new Badge();
        badge.setId(2L);
        badge.setConditionType("points");
        badge.setConditionValue(threshold);
        badge.setStatus(1);
        return badge;
    }
}
