package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 徽章自动颁发（积分变动或行为累计后检查条件）
 */
@Service
@RequiredArgsConstructor
public class BadgeGrantService {

    private final BadgeMapper badgeMapper;
    private final MemberBadgeMapper memberBadgeMapper;
    private final MemberMapper memberMapper;
    private final PointRecordMapper pointRecordMapper;
    private final EnrollMapper enrollMapper;
    private final EventLogMapper eventLogMapper;

    /** 检查并写入新获得的徽章 */
    public void checkAndGrant(Long memberId) {
        if (memberId == null) {
            return;
        }
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            return;
        }
        Set<Long> owned = loadOwnedBadgeIds(memberId);
        List<Badge> badges = badgeMapper.selectList(new LambdaQueryWrapper<Badge>()
                .eq(Badge::getStatus, 1));
        int points = member.getPoints() != null ? member.getPoints() : 0;

        for (Badge badge : badges) {
            if (owned.contains(badge.getId())) {
                continue;
            }
            if (!isConditionMet(badge, memberId, points)) {
                continue;
            }
            MemberBadge mb = new MemberBadge();
            mb.setMemberId(memberId);
            mb.setBadgeId(badge.getId());
            mb.setAchievedAt(LocalDateTime.now());
            memberBadgeMapper.insert(mb);
            owned.add(badge.getId());
        }
    }

    private Set<Long> loadOwnedBadgeIds(Long memberId) {
        Set<Long> ids = new HashSet<>();
        memberBadgeMapper.selectList(new LambdaQueryWrapper<MemberBadge>()
                        .eq(MemberBadge::getMemberId, memberId))
                .forEach(mb -> ids.add(mb.getBadgeId()));
        return ids;
    }

    private boolean isConditionMet(Badge badge, Long memberId, int points) {
        String type = badge.getConditionType();
        int need = badge.getConditionValue() != null ? badge.getConditionValue() : 0;
        if ("points".equals(type)) {
            return points >= need;
        }
        if ("login_count".equals(type)) {
            long count = pointRecordMapper.selectCount(new LambdaQueryWrapper<PointRecord>()
                    .eq(PointRecord::getMemberId, memberId)
                    .eq(PointRecord::getAction, "login"));
            return count >= Math.max(need, 1);
        }
        if ("enroll_count".equals(type)) {
            long count = enrollMapper.selectCount(new LambdaQueryWrapper<Enroll>()
                    .eq(Enroll::getMemberId, memberId)
                    .in(Enroll::getStatus, "pending", "approved"));
            return count >= need;
        }
        if ("hall_count".equals(type)) {
            return countDistinctHallViews(memberId) >= need;
        }
        if ("course_count".equals(type)) {
            long count = pointRecordMapper.selectCount(new LambdaQueryWrapper<PointRecord>()
                    .eq(PointRecord::getMemberId, memberId)
                    .eq(PointRecord::getAction, "complete_course"));
            return count >= need;
        }
        return false;
    }

    /** 统计用户浏览过的不同展馆数量 */
    private long countDistinctHallViews(Long memberId) {
        List<EventLog> logs = eventLogMapper.selectList(new LambdaQueryWrapper<EventLog>()
                .eq(EventLog::getMemberId, memberId)
                .eq(EventLog::getEventType, "view")
                .eq(EventLog::getTargetType, "hall")
                .isNotNull(EventLog::getTargetId));
        return logs.stream().map(EventLog::getTargetId).distinct().count();
    }
}
