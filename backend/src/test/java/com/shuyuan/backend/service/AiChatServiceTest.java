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
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private AiChatPersistenceService aiChatPersistenceService;

    private ShuyuanProperties properties;
    @InjectMocks
    private AiChatService aiChatService;

    @BeforeEach
    void setUp() {
        com.shuyuan.backend.common.context.MemberContext.clear();
        properties = new ShuyuanProperties();
        properties.getAi().setMaxChunks(5);
        properties.getRateLimit().setAiPerDay(20);
        aiChatService = new AiChatService(
                aiSessionMapper, aiMessageMapper, contentSafetyService,
                knowledgeService, aiClientService, rateLimitService,
                aiChatPersistenceService, properties);
    }

    @Test
    void chat_delegatesPersistenceToSeparateBean() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(1L);
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
        // 检索到了对得上的资料，这一次应正常计费
        when(knowledgeService.hasSubstantialMatch(eq("阳明文化"), anyList(), anyInt())).thenReturn(true);
        when(aiClientService.chat(any(), any())).thenAnswer(invocation -> {
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive(),
                    "外部 AI 调用不应处于数据库事务中");
            return "根据书院资料，阳明心学强调知行合一。";
        });
        when(rateLimitService.getUserCalendarDayUsage("ai", 1L)).thenReturn(3);

        Map<String, Object> persisted = new HashMap<>();
        persisted.put("role", "assistant");
        persisted.put("content", "根据书院资料，阳明心学强调知行合一。");
        when(aiChatPersistenceService.saveChatTurn(eq(9L), eq("阳明文化"), anyString(), anyList(), eq("pass")))
                .thenReturn(persisted);

        AiChatRequest req = new AiChatRequest();
        req.setQuestion("阳明文化");
        var result = aiChatService.chat(9L, req);

        assertEquals("assistant", result.get("role"));
        assertEquals(17, result.get("remainingToday"));
        verify(aiChatPersistenceService).saveChatTurn(eq(9L), eq("阳明文化"), anyString(), anyList(), eq("pass"));
        verify(aiMessageMapper, never()).insert(any(AiMessage.class));
        verify(rateLimitService, never()).refundUserCalendarDay(anyString(), anyLong());
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    // ---------- 知识库答不上来时不该扣用户次数 ----------

    private AiSession openSession(long sessionId, long memberId) {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(memberId);
        AiSession session = new AiSession();
        session.setId(sessionId);
        session.setMemberId(memberId);
        when(aiSessionMapper.selectById(sessionId)).thenReturn(session);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        when(aiChatPersistenceService.saveChatTurn(anyLong(), anyString(), anyString(), anyList(), anyString()))
                .thenAnswer(inv -> {
                    Map<String, Object> vo = new HashMap<>();
                    vo.put("content", inv.getArgument(2));
                    return vo;
                });
        return session;
    }

    private Map<String, Object> ask(long sessionId, String question) {
        AiChatRequest req = new AiChatRequest();
        req.setQuestion(question);
        return aiChatService.chat(sessionId, req);
    }

    /**
     * 一段资料都没检索到时不要再问模型。
     *
     * <p>它拿到的上下文只有「（无匹配资料）」，只会回一句「没有找到相关资料」——
     * 同样的话我们自己说得更快、更准，还省一次调用。
     */
    @Test
    void 检索为空时不调用模型且不扣次数() {
        openSession(11L, 5L);
        when(knowledgeService.retrieve(anyString(), anyInt())).thenReturn(List.of());
        when(rateLimitService.getUserCalendarDayUsage("ai", 5L)).thenReturn(0);

        Map<String, Object> vo = ask(11L, "比利时的首都在哪");

        verify(aiClientService, never()).chat(anyList(), anyString());
        verify(rateLimitService).refundUserCalendarDay(RateLimitService.SCENE_AI, 5L);
        assertEquals(AiChatService.NO_MATERIAL_ANSWER, vo.get("content"));
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    /**
     * 检索到了片段、但都对不上题：照常交给模型作答（该由模型说的话仍由模型说），
     * 但这一次不计入用户的每日次数——他没得到有用的东西。
     */
    @Test
    void 检索到片段但不算实质命中时照常作答却不扣次数() {
        openSession(12L, 6L);
        KnowledgeChunk noise = new KnowledgeChunk();
        noise.setChunkText("怎么报名活动……");
        when(knowledgeService.retrieve(anyString(), anyInt())).thenReturn(List.of(noise));
        when(knowledgeService.hasSubstantialMatch(anyString(), anyList(), anyInt())).thenReturn(false);
        when(aiClientService.chat(anyList(), anyString())).thenReturn("很抱歉，我没有找到相关信息。");
        when(rateLimitService.getUserCalendarDayUsage("ai", 6L)).thenReturn(0);

        Map<String, Object> vo = ask(12L, "我心情不好怎么办");

        verify(aiClientService).chat(anyList(), anyString());
        verify(rateLimitService).refundUserCalendarDay(RateLimitService.SCENE_AI, 6L);
        assertEquals("很抱歉，我没有找到相关信息。", vo.get("content"));
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    /** 退还必须发生在保存成功之后，读余额仍须在退还之后 */
    @Test
    void 余额在退还之后再读() {
        openSession(13L, 7L);
        when(knowledgeService.retrieve(anyString(), anyInt())).thenReturn(List.of());
        when(rateLimitService.getUserCalendarDayUsage("ai", 7L)).thenReturn(0);

        ask(13L, "今天星期几");

        var order = inOrder(aiChatPersistenceService, rateLimitService);
        order.verify(aiChatPersistenceService).saveChatTurn(eq(13L), eq("今天星期几"), anyString(), anyList(), eq("pass"));
        order.verify(rateLimitService).refundUserCalendarDay(RateLimitService.SCENE_AI, 7L);
        order.verify(rateLimitService).getUserCalendarDayUsage("ai", 7L);
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    /** save 失败时不业务退还，避免与拦截器 5xx 退还叠成两次 */
    @Test
    void 无实质命中但保存失败时不业务退还() {
        openSession(14L, 8L);
        when(knowledgeService.retrieve(anyString(), anyInt())).thenReturn(List.of());
        when(aiChatPersistenceService.saveChatTurn(anyLong(), anyString(), anyString(), anyList(), anyString()))
                .thenThrow(new RuntimeException("db down"));

        assertThrows(RuntimeException.class, () -> ask(14L, "今天星期几"));
        verify(rateLimitService, never()).refundUserCalendarDay(anyString(), anyLong());
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    @Test
    void quota_returnsRemainingForLoggedInUser() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(2L);
        when(rateLimitService.getUserCalendarDayUsage("ai", 2L)).thenReturn(5);

        var result = aiChatService.quota();

        assertEquals(false, result.get("needLogin"));
        assertEquals(20, result.get("dailyLimit"));
        assertEquals(5, result.get("used"));
        assertEquals(15, result.get("remaining"));
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    @Test
    void quota_requiresLoginWhenGuest() {
        var result = aiChatService.quota();
        assertEquals(true, result.get("needLogin"));
        assertEquals(0, result.get("remaining"));
    }

    @Test
    void listSessions_includesPreviewFromFirstUserMessage() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(3L);
        AiSession session = new AiSession();
        session.setId(7L);
        session.setMemberId(3L);
        when(aiSessionMapper.selectList(any())).thenReturn(List.of(session));

        AiMessage question = new AiMessage();
        question.setRole("user");
        question.setContent("请介绍阳明心学");
        when(aiMessageMapper.selectOne(any())).thenReturn(question);

        var result = aiChatService.listSessions();

        assertEquals(1, result.size());
        assertEquals("请介绍阳明心学", result.get(0).get("preview"));
        com.shuyuan.backend.common.context.MemberContext.clear();
    }
}
