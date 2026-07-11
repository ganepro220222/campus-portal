package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AiPolishRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminAiPolishService {

    private static final String SYSTEM_PROMPT =
            "你是贵州交通职业大学中华文化书院的内容编辑助手。"
                    + "书院文风特点：典雅、庄重、有文化底蕴，适合面向师生与社会大众。"
                    + "请直接输出编辑结果，不要附加解释性前缀。";

    private static final Set<String> ACTIONS = Set.of(
            "polish", "expand", "summarize", "title", "translate_en"
    );

    private final AdminPermissionService adminPermissionService;
    private final ZhipuAiService zhipuAiService;
    private final AiCopyAssistFallbackService fallbackService;
    private final ContentSafetyService contentSafetyService;

    public Map<String, Object> polish(AiPolishRequest req) {
        adminPermissionService.require("news:write");
        adminPermissionService.requireAdminId();

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
        return vo;
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
