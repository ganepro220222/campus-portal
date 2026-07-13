package com.shuyuan.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.entity.AiMessage;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.mapper.AiMessageMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AI 会话持久化：独立 Bean 保证 {@link Transactional} 经 Spring 代理生效，避免同类自调用失效。
 */
@Service
@RequiredArgsConstructor
public class AiChatPersistenceService {

    private final AiMessageMapper aiMessageMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> saveChatTurn(Long sessionId, String question, String answer,
                                            List<KnowledgeChunk> chunks, String safetyStatus) {
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
