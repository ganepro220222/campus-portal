package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.FeedbackReplyRequest;
import com.shuyuan.backend.entity.Feedback;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.mapper.FeedbackMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminFeedbackService {

    private static final int REPLY_MAX = 2000;

    private final FeedbackMapper feedbackMapper;
    private final MemberMapper memberMapper;
    private final AdminPermissionService adminPermissionService;
    private final ObjectMapper objectMapper;

    public PageResult<Map<String, Object>> list(int page, int size, String status) {
        adminPermissionService.require("admin:super");
        LambdaQueryWrapper<Feedback> qw = new LambdaQueryWrapper<Feedback>()
                .orderByDesc(Feedback::getCreateTime);
        if (status != null && !status.isBlank()) {
            qw.eq(Feedback::getStatus, status.trim());
        }
        Page<Feedback> p = feedbackMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, Member> members = loadMembers(p.getRecords());
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(f -> toVo(f, members.get(f.getMemberId())))
                .toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("admin:super");
        Feedback feedback = requireFeedback(id);
        Member member = memberMapper.selectById(feedback.getMemberId());
        return toVo(feedback, member);
    }

    @Transactional
    public Map<String, Object> reply(Long id, FeedbackReplyRequest req) {
        adminPermissionService.require("admin:super");
        Feedback feedback = requireFeedback(id);
        if (req == null || req.getReply() == null || req.getReply().isBlank()) {
            throw new BusinessException(400, "请填写回复内容");
        }
        String reply = req.getReply().trim();
        if (reply.length() > REPLY_MAX) {
            throw new BusinessException(400, "回复内容不超过 " + REPLY_MAX + " 字");
        }
        feedback.setReply(reply);
        feedback.setStatus("replied");
        feedback.setRepliedAt(LocalDateTime.now());
        feedback.setRepliedBy(AdminContext.getAdminId());
        feedbackMapper.updateById(feedback);
        Member member = memberMapper.selectById(feedback.getMemberId());
        return toVo(feedbackMapper.selectById(id), member);
    }

    private Feedback requireFeedback(Long id) {
        Feedback feedback = feedbackMapper.selectById(id);
        if (feedback == null) {
            throw new BusinessException(404, "反馈不存在");
        }
        return feedback;
    }

    private Map<Long, Member> loadMembers(List<Feedback> list) {
        Set<Long> ids = list.stream().map(Feedback::getMemberId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return memberMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(Member::getId, m -> m, (a, b) -> a));
    }

    private Map<String, Object> toVo(Feedback feedback, Member member) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", feedback.getId());
        m.put("memberId", feedback.getMemberId());
        m.put("memberNickname", member != null ? member.getNickname() : "");
        m.put("type", feedback.getType());
        m.put("content", feedback.getContent());
        m.put("contact", feedback.getContact());
        m.put("images", parseImages(feedback.getImages()));
        m.put("status", feedback.getStatus());
        m.put("reply", feedback.getReply());
        m.put("repliedAt", FormatUtils.formatDateTime(feedback.getRepliedAt()));
        m.put("createTime", FormatUtils.formatDateTime(feedback.getCreateTime()));
        return m;
    }

    private List<String> parseImages(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
