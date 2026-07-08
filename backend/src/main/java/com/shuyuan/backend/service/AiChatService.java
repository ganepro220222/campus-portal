package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.AiChatRequest;
import com.shuyuan.backend.entity.AiMessage;
import com.shuyuan.backend.entity.AiSession;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.mapper.AiMessageMapper;
import com.shuyuan.backend.mapper.AiSessionMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiSessionMapper aiSessionMapper;
    private final AiMessageMapper aiMessageMapper;
    private final ContentSafetyService contentSafetyService;
    private final KnowledgeService knowledgeService;
    private final AiClientService aiClientService;
    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> createSession() {
        Long memberId = requireMemberId();
        AiSession session = new AiSession();
        session.setMemberId(memberId);
        session.setCreatedAt(LocalDateTime.now());
        aiSessionMapper.insert(session);
        return sessionVo(session);
    }

    public List<Map<String, Object>> listSessions() {
        Long memberId = requireMemberId();
        List<AiSession> sessions = aiSessionMapper.selectList(
                new LambdaQueryWrapper<AiSession>()
                        .eq(AiSession::getMemberId, memberId)
                        .orderByDesc(AiSession::getCreatedAt)
                        .last("LIMIT 30"));
        return sessions.stream().map(this::sessionVo).toList();
    }

    public List<Map<String, Object>> listMessages(Long sessionId) {
        Long memberId = requireMemberId();
        requireOwnedSession(sessionId, memberId);
        List<AiMessage> messages = aiMessageMapper.selectList(
                new LambdaQueryWrapper<AiMessage>()
                        .eq(AiMessage::getSessionId, sessionId)
                        .orderByAsc(AiMessage::getCreatedAt));
        return messages.stream().map(this::messageVo).toList();
    }

    @Transactional
    public Map<String, Object> chat(Long sessionId, AiChatRequest req) {
        Long memberId = requireMemberId();
        requireOwnedSession(sessionId, memberId);
        String question = req.getQuestion().trim();

        if (!contentSafetyService.checkText(question)) {
            throw new BusinessException(400, "问题包含不当内容，请修改后重试");
        }

        List<KnowledgeChunk> chunks = knowledgeService.retrieve(question, properties.getAi().getMaxChunks());
        String answer = aiClientService.chat(chunks, question);
        String safetyStatus = "pass";
        if (!contentSafetyService.checkText(answer)) {
            answer = "该问题暂时无法回答，请换个方式提问。";
            safetyStatus = "blocked";
        }

        saveMessage(sessionId, "user", question, null, "pass");
        AiMessage assistant = saveMessage(sessionId, "assistant", answer, chunks, safetyStatus);

        Map<String, Object> vo = messageVo(assistant);
        vo.put("sources", chunks.stream().map(c -> {
            Map<String, Object> s = new HashMap<>();
            s.put("chunkId", c.getId());
            s.put("docId", c.getDocId());
            s.put("excerpt", excerpt(c.getChunkText()));
            return s;
        }).toList());
        return vo;
    }

    private AiMessage saveMessage(Long sessionId, String role, String content,
                                  List<KnowledgeChunk> chunks, String safetyStatus) {
        AiMessage msg = new AiMessage();
        msg.setSessionId(sessionId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setSafetyStatus(safetyStatus);
        msg.setCreatedAt(LocalDateTime.now());
        if (chunks != null && !chunks.isEmpty()) {
            List<Long> ids = chunks.stream().map(KnowledgeChunk::getId).collect(Collectors.toList());
            try {
                msg.setSourceChunkIds(objectMapper.writeValueAsString(ids));
            } catch (JsonProcessingException ignored) {
                msg.setSourceChunkIds("[]");
            }
        }
        aiMessageMapper.insert(msg);
        return msg;
    }

    private AiSession requireOwnedSession(Long sessionId, Long memberId) {
        AiSession session = aiSessionMapper.selectById(sessionId);
        if (session == null || !memberId.equals(session.getMemberId())) {
            throw new BusinessException(404, "会话不存在");
        }
        return session;
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }

    private Map<String, Object> sessionVo(AiSession session) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", session.getId());
        m.put("createdAt", FormatUtils.formatDateTime(session.getCreatedAt()));
        return m;
    }

    private Map<String, Object> messageVo(AiMessage msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", msg.getId());
        m.put("sessionId", msg.getSessionId());
        m.put("role", msg.getRole());
        m.put("content", msg.getContent());
        m.put("safetyStatus", msg.getSafetyStatus());
        m.put("createdAt", FormatUtils.formatDateTime(msg.getCreatedAt()));
        return m;
    }

    private String excerpt(String text) {
        if (text == null) {
            return "";
        }
        return text.length() > 120 ? text.substring(0, 120) + "…" : text;
    }
}
