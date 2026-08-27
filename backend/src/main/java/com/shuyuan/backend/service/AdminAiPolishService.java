package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.AiPolishRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminAiPolishService {

    /*
     * 与 AiClientService 同一条原则：提示词不冒任何机构的名义。
     * 这里产出的稿件会被编辑贴进正式内容发布出去，模型若以「某某学校某某书院」自居，
     * 等于让它替一个它并不代表的主体说话。只描述文风要求，不给它身份。
     */
    private static final String SYSTEM_PROMPT =
            "你是一名中文内容编辑助手，服务于一个校园线上学习与活动服务平台。"
                    + "文风要求：准确、简洁、庄重，适合面向师生阅读。"
                    + "请直接输出编辑结果，不要附加解释性前缀，也不要替平台作出承诺。";

    private static final Set<String> ACTIONS = Set.of(
            "polish", "expand", "summarize", "title", "translate_en"
    );

    private final AdminPermissionService adminPermissionService;
    private final ZhipuAiService zhipuAiService;
    private final AiCopyAssistFallbackService fallbackService;
    private final ContentSafetyService contentSafetyService;
    private final RateLimitService rateLimitService;
    private final ShuyuanProperties properties;

    public Map<String, Object> polish(AiPolishRequest req) {
        adminPermissionService.require("news:write");
        Long adminId = adminPermissionService.requireAdminId();

        String action = normalizeAction(req.getAction());
        String content = req.getContent() == null ? "" : req.getContent().trim();
        if (content.isBlank()) {
            throw new BusinessException(400, "内容不能为空");
        }
        if (!contentSafetyService.checkText(content)) {
            throw new BusinessException(400, "内容未通过安全审核，请修改后重试");
        }

        boolean fallback = !zhipuAiService.canUse();
        String result = fallback
                ? fallbackService.transform(action, content)
                : zhipuAiService.chat(SYSTEM_PROMPT, buildUserPrompt(action, content, req.getTone()));

        result = result == null ? "" : result.trim();
        if (result.isBlank()) {
            throw new BusinessException(502, "AI 未返回有效内容");
        }
        if (!contentSafetyService.checkText(result)) {
            throw new BusinessException(400, "生成结果未通过安全审核，请调整原文后重试");
        }

        Map<String, Object> vo = new HashMap<>();
        vo.put("action", action);
        vo.put("content", result);
        vo.put("fallback", fallback);
        vo.putAll(quotaFields(adminId));
        return vo;
    }

    /**
     * 把剩余额度随结果一起带回去，让工具条能常驻显示「今日剩余 N 次」。
     *
     * <p>不给它单开一个 quota 接口：编辑用一次就刷新一次，够用了；而撞到上限才第一次
     * 知道有上限，是最糟的一种交互。计数在拦截器里已经扣过，所以这里读到的用量含本次。
     */
    private Map<String, Object> quotaFields(Long adminId) {
        int dailyLimit = properties.getAi().getDailyLimit();
        int used = rateLimitService.getUserCalendarDayUsage(RateLimitService.SCENE_AI_POLISH, adminId);
        Map<String, Object> fields = new HashMap<>();
        fields.put("dailyLimit", dailyLimit);
        fields.put("remainingToday", Math.max(0, dailyLimit - used));
        return fields;
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new BusinessException(400, "操作类型不能为空");
        }
        String normalized = action.trim().toLowerCase(Locale.ROOT);
        if (!ACTIONS.contains(normalized)) {
            throw new BusinessException(400, "不支持的操作类型");
        }
        return normalized;
    }

    private String buildUserPrompt(String action, String content, String tone) {
        String toneHint = tone != null && !tone.isBlank()
                ? "（文风偏好：" + tone.trim() + "）\n"
                : "";
        return switch (action) {
            case "polish" -> toneHint + "请对以下文字进行润色，保持原意和书院文化语言风格：\n" + content;
            case "expand" -> toneHint + "请对以下文字进行扩写（约 150 字）：\n" + content;
            case "summarize" -> toneHint + "请为以下内容生成 50 字以内的摘要：\n" + content;
            case "title" -> toneHint + "请为以下内容生成 3 个标题建议：\n" + content;
            case "translate_en" -> toneHint + "请将以下中文翻译为规范的英文：\n" + content;
            default -> content;
        };
    }
}
