package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Message;
import com.shuyuan.backend.mapper.MessageMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 站内消息（《交付物》§2.8 无授权用户消息中心兜底）
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageMapper messageMapper;

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
        return messageMapper.selectList(new LambdaQueryWrapper<Message>()
                        .eq(Message::getMemberId, memberId)
                        .orderByDesc(Message::getCreatedAt)
                        .last("LIMIT 100"))
                .stream()
                .map(this::toVo)
                .toList();
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

    private Map<String, Object> toVo(Message msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", msg.getId());
        m.put("title", msg.getTitle());
        m.put("content", msg.getContent());
        m.put("type", msg.getType());
        m.put("relatedType", msg.getRelatedType());
        m.put("relatedId", msg.getRelatedId());
        m.put("readStatus", msg.getReadStatus() != null ? msg.getReadStatus() : 0);
        m.put("createdAt", FormatUtils.formatDateTime(msg.getCreatedAt()));
        m.put("route", buildRoute(msg.getRelatedType(), msg.getRelatedId()));
        return m;
    }

    private String buildRoute(String relatedType, Long relatedId) {
        if (relatedType == null || relatedId == null) {
            return "";
        }
        if ("activity".equals(relatedType)) {
            return "/packageC/activity/detail?id=" + relatedId;
        }
        return "";
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
