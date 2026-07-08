package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiClientService {

    private static final String SYSTEM_PROMPT =
            "你是贵州交通职业大学中华文化书院的智能文化助手。"
                    + "请基于提供的书院资料作答，语言典雅、准确、简洁；"
                    + "若资料不足以回答，请诚实说明并引导用户换个问法。";

    private final ZhipuAiService zhipuAiService;
    private final FallbackAiService fallbackAiService;

    public String chat(List<KnowledgeChunk> chunks, String question) {
        String userPrompt = buildUserPrompt(chunks, question);
        if (zhipuAiService.canUse()) {
            return zhipuAiService.chat(SYSTEM_PROMPT, userPrompt);
        }
        return fallbackAiService.chat(SYSTEM_PROMPT, userPrompt, chunks);
    }

    private String buildUserPrompt(List<KnowledgeChunk> chunks, String question) {
        String context = chunks == null || chunks.isEmpty()
                ? "（无匹配资料）"
                : chunks.stream()
                .map(KnowledgeChunk::getChunkText)
                .collect(Collectors.joining("\n---\n"));
        return "【书院资料】\n" + context + "\n\n【用户问题】\n" + question;
    }
}
