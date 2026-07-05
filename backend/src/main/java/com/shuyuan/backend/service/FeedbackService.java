package com.shuyuan.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.FeedbackSubmitRequest;
import com.shuyuan.backend.entity.Feedback;
import com.shuyuan.backend.mapper.FeedbackMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final Set<String> ALLOWED_TYPES = Set.of("功能建议", "内容纠错", "使用问题", "其他");
    private static final int CONTENT_MAX = 2000;
    private static final int CONTACT_MAX = 100;

    private final FeedbackMapper feedbackMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> submit(FeedbackSubmitRequest req) {
        Long memberId = requireMemberId();
        if (req == null || req.getContent() == null || req.getContent().isBlank()) {
            throw new BusinessException(400, "请填写反馈内容");
        }
        String content = req.getContent().trim();
        if (content.length() > CONTENT_MAX) {
            throw new BusinessException(400, "反馈内容不超过 " + CONTENT_MAX + " 字");
        }
        String type = normalizeType(req.getType());
        String contact = req.getContact() == null ? "" : req.getContact().trim();
        if (contact.length() > CONTACT_MAX) {
            throw new BusinessException(400, "联系方式过长");
        }

        Feedback feedback = new Feedback();
        feedback.setMemberId(memberId);
        feedback.setType(type);
        feedback.setContent(content);
        feedback.setContact(contact.isEmpty() ? null : contact);
        feedback.setImages(serializeImages(req.getImages()));
        feedback.setStatus("pending");
        feedbackMapper.insert(feedback);
        return toVo(feedbackMapper.selectById(feedback.getId()));
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "其他";
        }
        String t = type.trim();
        return ALLOWED_TYPES.contains(t) ? t : "其他";
    }

    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        List<String> cleaned = images.stream()
                .filter(u -> u != null && !u.isBlank())
                .map(String::trim)
                .limit(9)
                .toList();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(cleaned);
        } catch (JsonProcessingException e) {
            throw new BusinessException(400, "图片参数格式错误");
        }
    }

    private Map<String, Object> toVo(Feedback feedback) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", feedback.getId());
        m.put("type", feedback.getType());
        m.put("content", feedback.getContent());
        m.put("contact", feedback.getContact());
        m.put("status", feedback.getStatus());
        m.put("createTime", FormatUtils.formatDateTime(feedback.getCreateTime()));
        return m;
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
