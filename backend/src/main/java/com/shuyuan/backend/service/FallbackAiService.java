package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/** 无 API Key 时的问答兜底：基于检索片段组织回答 */
@Service
@RequiredArgsConstructor
public class FallbackAiService {

    public String chat(String systemPrompt, String userPrompt, List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "暂未在书院知识库中找到相关资料，您可以换个问法，或通过「全局搜索」查询新闻、课程与展馆内容。";
        }
        String refs = chunks.stream()
                .map(KnowledgeChunk::getChunkText)
                .limit(3)
                .collect(Collectors.joining("\n\n"));
        return "根据书院文化资料整理如下：\n\n" + refs
                + "\n\n如需更深入了解，欢迎继续提问或前往相关展馆、课程页面浏览。";
    }
}
