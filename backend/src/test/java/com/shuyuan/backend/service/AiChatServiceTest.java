package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.AiChatRequest;
import com.shuyuan.backend.entity.AiMessage;
import com.shuyuan.backend.entity.AiSession;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.mapper.AiMessageMapper;
import com.shuyuan.backend.mapper.AiSessionMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private AiSessionMapper aiSessionMapper;
    @Mock
    private AiMessageMapper aiMessageMapper;
    @Mock
    private ContentSafetyService contentSafetyService;
    @Mock
    private KnowledgeService knowledgeService;
    @Mock
    private AiClientService aiClientService;

    private ShuyuanProperties properties;
    @InjectMocks
    private AiChatService aiChatService;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getAi().setMaxChunks(5);
        aiChatService = new AiChatService(
                aiSessionMapper, aiMessageMapper, contentSafetyService,
                knowledgeService, aiClientService, properties, new ObjectMapper());
        com.shuyuan.backend.common.context.MemberContext.setMemberId(1L);
    }

    @Test
    void chat_persistsAssistantReply() {
        AiSession session = new AiSession();
        session.setId(9L);
        session.setMemberId(1L);
        when(aiSessionMapper.selectById(9L)).thenReturn(session);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setId(1L);
        chunk.setDocId(2L);
        chunk.setChunkText("阳明心学强调知行合一。");
        when(knowledgeService.retrieve("阳明文化", 5)).thenReturn(List.of(chunk));
        when(aiClientService.chat(any(), any())).thenReturn("根据书院资料，阳明心学强调知行合一。");

        AiChatRequest req = new AiChatRequest();
        req.setQuestion("阳明文化");
        var result = aiChatService.chat(9L, req);

        assertEquals("assistant", result.get("role"));
        verify(aiMessageMapper, atLeast(2)).insert(any(AiMessage.class));
        com.shuyuan.backend.common.context.MemberContext.clear();
    }
}
