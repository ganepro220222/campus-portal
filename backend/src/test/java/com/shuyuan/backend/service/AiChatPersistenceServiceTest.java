package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.entity.AiMessage;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.mapper.AiMessageMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiChatPersistenceServiceTest {

    @Mock
    private AiMessageMapper aiMessageMapper;

    @InjectMocks
    private AiChatPersistenceService persistenceService;

    @Test
    void saveChatTurn_persistsUserAndAssistantPair() {
        persistenceService = new AiChatPersistenceService(aiMessageMapper, new ObjectMapper());

        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setId(10L);
        chunk.setDocId(20L);
        chunk.setChunkText("测试片段");

        Map<String, Object> result = persistenceService.saveChatTurn(
                5L, "问题", "回答", List.of(chunk), "pass");

        assertEquals("assistant", result.get("role"));
        assertEquals("回答", result.get("content"));
        assertNotNull(result.get("sources"));

        ArgumentCaptor<AiMessage> captor = ArgumentCaptor.forClass(AiMessage.class);
        verify(aiMessageMapper, times(2)).insert(captor.capture());
        assertEquals("user", captor.getAllValues().get(0).getRole());
        assertEquals("assistant", captor.getAllValues().get(1).getRole());
    }
}
