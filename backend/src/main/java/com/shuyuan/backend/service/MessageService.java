package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Message;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.MessageMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 站内消息（未登录用户也可看平台通知）
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    /** 活动取消后详情不可访问，列表不得再给出活动路由。 */
    public static final String TITLE_ACTIVITY_CANCELLED = "活动已取消";

    private final MessageMapper messageMapper;
    private final ActivityMapper activityMapper;

    public void create(Long memberId, String title, String content, String type,
                       String relatedType, Long relatedId) {
        Message msg = new Message();
        msg.setMemberId(memberId);
        msg.setTitle(title);
        msg.setContent(content);
        msg.setType(type);
        msg.setRelatedType(relatedType);
        msg.setRelatedId(relatedId);
        msg.setReadStatus(0);
        messageMapper.insert(msg);
    }

    public List<Map<String, Object>> listMine() {
        Long memberId = requireMemberId();
        List<Message> messages = messageMapper.selectList(new LambdaQueryWrapper<Message>()
                .eq(Message::getMemberId, memberId)
                .orderByDesc(Message::getCreatedAt)
                .last("LIMIT 100"));
        Set<Long> publishedActivityIds = publishedActivityIds(messages);
        return messages.stream()
                .map(msg -> toVo(msg, publishedActivityIds))
                .toList();
    }

    /**
     * 活动取消后详情不可访问。清掉该场所有历史消息的跳转关联，正文保留。
     */
    public int clearActivityRoutes(Long activityId) {
        if (activityId == null) {
            return 0;
        }
        return messageMapper.update(null, new LambdaUpdateWrapper<Message>()
                .eq(Message::getRelatedType, "activity")
                .eq(Message::getRelatedId, activityId)
                .set(Message::getRelatedType, null)
                .set(Message::getRelatedId, null));
    }

    public long unreadCount(Long memberId) {
        if (memberId == null) {
            return 0;
        }
        return messageMapper.selectCount(new LambdaQueryWrapper<Message>()
                .eq(Message::getMemberId, memberId)
                .eq(Message::getReadStatus, 0));
    }

    public void markRead(Long messageId) {
        Long memberId = requireMemberId();
        Message msg = messageMapper.selectById(messageId);
        if (msg == null || !memberId.equals(msg.getMemberId())) {
            throw new BusinessException(404, "消息不存在");
        }
        if (msg.getReadStatus() != null && msg.getReadStatus() == 1) {
            return;
        }
        Message update = new Message();
        update.setId(messageId);
        update.setReadStatus(1);
        messageMapper.updateById(update);
    }

    public void markAllRead() {
        Long memberId = requireMemberId();
        messageMapper.update(null, new LambdaUpdateWrapper<Message>()
                .eq(Message::getMemberId, memberId)
                .eq(Message::getReadStatus, 0)
                .set(Message::getReadStatus, 1));
    }

    private Map<String, Object> toVo(Message msg, Set<Long> publishedActivityIds) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", msg.getId());
        m.put("title", msg.getTitle());
        m.put("content", msg.getContent());
        m.put("type", msg.getType());
        m.put("relatedType", msg.getRelatedType());
        m.put("relatedId", msg.getRelatedId());
        m.put("readStatus", msg.getReadStatus() != null ? msg.getReadStatus() : 0);
        m.put("createdAt", FormatUtils.formatDateTime(msg.getCreatedAt()));
        m.put("route", buildRoute(msg.getTitle(), msg.getRelatedType(), msg.getRelatedId(), publishedActivityIds));
        return m;
    }

    static String buildRoute(String title, String relatedType, Long relatedId) {
        return buildRoute(title, relatedType, relatedId, Set.of());
    }

    static String buildRoute(String title, String relatedType, Long relatedId, Set<Long> publishedActivityIds) {
        if (relatedType == null || relatedId == null) {
            return "";
        }
        if (TITLE_ACTIVITY_CANCELLED.equals(title) && "activity".equals(relatedType)) {
            return "";
        }
        if ("activity".equals(relatedType)) {
            if (publishedActivityIds == null || !publishedActivityIds.contains(relatedId)) {
                return "";
            }
            return "/packageC/activity/detail?id=" + relatedId;
        }
        if ("feedback".equals(relatedType)) {
            return "/packageC/feedback/detail?id=" + relatedId;
        }
        return "";
    }

    private Set<Long> publishedActivityIds(List<Message> messages) {
        Set<Long> ids = new HashSet<>();
        for (Message msg : messages) {
            if ("activity".equals(msg.getRelatedType()) && msg.getRelatedId() != null) {
                ids.add(msg.getRelatedId());
            }
        }
        if (ids.isEmpty()) {
            return Set.of();
        }
        return activityMapper.selectList(new LambdaQueryWrapper<Activity>()
                        .select(Activity::getId)
                        .in(Activity::getId, ids)
                        .eq(Activity::getStatus, "published"))
                .stream()
                .map(Activity::getId)
                .collect(Collectors.toSet());
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
