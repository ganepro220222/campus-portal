package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    /*
     * 提示词决定模型如何自称，而模型的回答是用户直接看得到的——写「贵州交通职业大学
     * 中华文化书院的助手」，它就会这么自我介绍，与小程序里的主体归属（运营方是公司、
     * 书院是内容来源）相矛盾。这里只说平台名，不冒任何机构的名义。
     */
    private static final String SYSTEM_PROMPT =
            "你是「云端书院」小程序的智能助手。"
                    + "请基于提供的平台资料作答，语言准确、简洁；"
                    + "若资料不足以回答，请诚实说明并引导用户换个问法。";

    private final ZhipuAiService zhipuAiService;
    private final FallbackAiService fallbackAiService;

    /**
     * 有 Key 就走大模型，否则用知识库片段作答。
     *
     * <p>上游失败一律降级而不是把异常抛给用户：接的是免费模型，QPS/额度超限是常态，
     * 而知识库片段本来就够回答大部分问题。让用户看到一个稍差的答案，
     * 比看到「暂时无法回答」要好得多。
     */
    public String chat(List<KnowledgeChunk> chunks, String question) {
        String userPrompt = buildUserPrompt(chunks, question);
        if (zhipuAiService.canUse()) {
            try {
                String answer = zhipuAiService.chat(SYSTEM_PROMPT, userPrompt);
                if (answer != null && !answer.isBlank()) {
                    return answer;
                }
                log.warn("大模型返回空内容，降级为知识库作答");
            } catch (Exception e) {
                log.warn("大模型调用失败，降级为知识库作答：{}", e.getMessage());
            }
        }
        return fallbackAiService.chat(SYSTEM_PROMPT, userPrompt, chunks);
    }

    private String buildUserPrompt(List<KnowledgeChunk> chunks, String question) {
        String context = chunks == null || chunks.isEmpty()
                ? "（无匹配资料）"
                : chunks.stream()
                .map(KnowledgeChunk::getChunkText)
                .collect(Collectors.joining("\n---\n"));
        return "【平台资料】\n" + context + "\n\n【用户问题】\n" + question;
    }
}
