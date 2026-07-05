package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.EventLog;
import com.shuyuan.backend.mapper.EventLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 用户行为事件写入（供个人中心足迹与 Phase 6 统计聚合）
 */
@Service
@RequiredArgsConstructor
public class EventLogService {

    private final EventLogMapper eventLogMapper;

    /**
     * 写入行为事件。未登录时 memberId 为空，仍可用于全站 PV 类统计。
     */
    public void record(String eventType, String targetType, Long targetId) {
        if (eventType == null || eventType.isBlank()) {
            return;
        }
        EventLog log = new EventLog();
        log.setMemberId(MemberContext.getMemberId());
        log.setEventType(eventType);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setCreatedAt(LocalDateTime.now());
        eventLogMapper.insert(log);
    }

    /** 仅登录用户写入（收藏、下载、报名等需出现在足迹中的行为） */
    public void recordIfLoggedIn(String eventType, String targetType, Long targetId) {
        if (MemberContext.getMemberId() == null) {
            return;
        }
        record(eventType, targetType, targetId);
    }
}
