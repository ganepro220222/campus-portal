package com.shuyuan.backend.service;

import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 无大模型 API Key 时的文案辅助兜底（规则型，便于本地演示）
 */
@Service
public class AiCopyAssistFallbackService {

    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");

    public String transform(String action, String content) {
        String text = normalize(content);
        if (text.isBlank()) {
            return "";
        }
        return switch (action) {
            case "polish" -> polish(text);
            case "expand" -> expand(text);
            case "summarize" -> summarize(text);
            case "title" -> title(text);
            case "translate_en" -> translateEn(text);
            default -> text;
        };
    }

    private String normalize(String content) {
        if (content == null) {
            return "";
        }
        return MULTI_SPACE.matcher(content.trim()).replaceAll(" ");
    }

    private String polish(String text) {
        String body = text;
        if (!body.endsWith("。") && !body.endsWith("！") && !body.endsWith("？")
                && !body.endsWith(".") && !body.endsWith("!") && !body.endsWith("?")) {
            body = body + "。";
        }
        return "承书院文脉，述时代新声。" + body;
    }

    private String expand(String text) {
        return text + " 书院立足中华优秀传统文化，融汇交通职业教育特色，"
                + "以典雅庄重的文风讲述校园故事，引导师生与社会公众共同感受文化自信与时代担当。";
    }

    private String summarize(String text) {
        int max = 50;
        if (text.length() <= max) {
            return text;
        }
        return text.substring(0, max).trim() + "…";
    }

    private String title(String text) {
        String seed = text.length() > 36 ? text.substring(0, 36).trim() + "…" : text;
        return "1. 【书院速递】" + seed + "\n"
                + "2. 云端书院 · " + seed + "\n"
                + "3. 文化传承视角下的" + seed;
    }

    private String translateEn(String text) {
        return "[EN draft] " + text;
    }
}
