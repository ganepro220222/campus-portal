package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiSessionMapper aiSessionMapper;
    private final AiMessageMapper aiMessageMapper;
    private final ContentSafetyService contentSafetyService;
    private final KnowledgeService knowledgeService;
    private final AiClientService aiClientService;
    private final RateLimitService rateLimitService;
    private final AiChatPersistenceService aiChatPersistenceService;
    private final ShuyuanProperties properties;

    /** 当前用户今日 AI 问答剩余次数 */
    public Map<String, Object> quota() {
        int dailyLimit = properties.getRateLimit().getAiPerDay();
        Long memberId = MemberContext.getMemberId();
        Map<String, Object> m = new HashMap<>();
        m.put("dailyLimit", dailyLimit);
        if (memberId == null) {
            m.put("needLogin", true);
            m.put("used", 0);
            m.put("remaining", 0);
            return m;
        }
        int used = rateLimitService.getUserCalendarDayUsage(RateLimitService.SCENE_AI, memberId);
        m.put("needLogin", false);
        m.put("used", used);
        m.put("remaining", Math.max(0, dailyLimit - used));
        return m;
    }

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
        return sessions.stream().map(session -> {
            Map<String, Object> m = sessionVo(session);
            m.put("preview", sessionPreview(session.getId()));
            return m;
        }).toList();
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

    public Map<String, Object> chat(Long sessionId, AiChatRequest req) {
        Long memberId = requireMemberId();
        requireOwnedSession(sessionId, memberId);
        String question = req.getQuestion().trim();

        if (!contentSafetyService.checkText(question)) {
            throw new BusinessException(400, "问题包含不当内容，请修改后重试");
        }

        List<KnowledgeChunk> chunks = knowledgeService.retrieve(question, properties.getAi().getMaxChunks());
        boolean substantial = knowledgeService.hasSubstantialMatch(
                question, chunks, properties.getAi().getMinRelevanceScore());

        /*
         * 一段资料都没检索到时不必再问模型：它拿到的上下文是「（无匹配资料）」，
         * 只会回一句「没有找到相关资料」——同样的话我们自己说得更快、更准，也更省。
         */
        String answer = chunks.isEmpty()
                ? NO_MATERIAL_ANSWER
                : aiClientService.chat(chunks, question);
        String safetyStatus = "pass";
        if (!contentSafetyService.checkText(answer)) {
            answer = "该问题暂时无法回答，请换个方式提问。";
            safetyStatus = "blocked";
        }

        /*
         * 知识库里没有能回答这个问题的资料时，不该扣用户当天的次数——他什么也没得到。
         *
         * <p>这里的判定只用来决定「扣不扣」，不用来决定「答不答」：检索到东西就照常交给模型，
         * 该由模型说的话仍然由模型说。这样判定偏高只是少扣一次（对用户宽容），
         * 偏低也只是维持现状（照扣），两个方向都不会误伤到回答本身。
         */
        Map<String, Object> vo = aiChatPersistenceService.saveChatTurn(
                sessionId, question, answer, chunks, safetyStatus);

        /*
         * 退还必须发生在保存成功之后：若 save 失败走 5xx，拦截器会退还这一次占用；
         * 若在这里先退、save 再失败，拦截器会再退一次，同一次提问会被退两遍。
         * 读余额仍放在退还之后，前端才能拿到「不计数」后的剩余次数。
         */
        if (!substantial) {
            rateLimitService.refundUserCalendarDay(RateLimitService.SCENE_AI, memberId);
        }

        vo.putAll(quotaFields());
        return vo;
    }

    /**
     * 一段资料都没检索到时的回答。
     *
     * <p>话术要给出下一步（换问法、去搜索、反馈补资料），而不是把用户堵在原地；
     * 明确说明这一次不计次数，免得他以为问一次亏一次。
     */
    static final String NO_MATERIAL_ANSWER =
            "书院知识库里暂时没有和这个问题相关的资料，所以我没法回答，本次也不会计入你今天的问答次数。"
                    + "你可以换一个更贴近书院或小程序功能的问法，比如「怎么报名活动」「积分怎么获得」；"
                    + "也可以用首页顶部的搜索框直接查动态、课程、展馆与资源。"
                    + "如果你觉得这个问题本该有答案，欢迎通过「意见反馈」告诉我们，管理员可以把相关资料补进知识库。";

    private Map<String, Object> quotaFields() {
        Map<String, Object> q = quota();
        Map<String, Object> fields = new HashMap<>();
        fields.put("dailyLimit", q.get("dailyLimit"));
        fields.put("remainingToday", q.get("remaining"));
        return fields;
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

    private String sessionPreview(Long sessionId) {
        AiMessage msg = aiMessageMapper.selectOne(new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getSessionId, sessionId)
                .eq(AiMessage::getRole, "user")
                .orderByAsc(AiMessage::getCreatedAt)
                .last("LIMIT 1"));
        if (msg == null || msg.getContent() == null || msg.getContent().isBlank()) {
            return "暂无提问";
        }
        String content = msg.getContent().trim();
        return content.length() > 48 ? content.substring(0, 48) + "…" : content;
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
}
