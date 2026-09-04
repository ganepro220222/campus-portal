package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import org.springframework.stereotype.Service;

import java.util.List;

/** 学生问答默认路径：只回一篇带标题的知识库摘录，不拼接、不润色。 */
@Service
public class FallbackAiService {

    static final String GUIDE_TITLE_PREFIX = "使用指南 · ";

    public String chat(String systemPrompt, String userPrompt, List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "暂未在书院知识库中找到相关资料，您可以换个问法，或通过首页搜索框查询动态、课程与展馆内容。";
        }
        return formatExcerpt(chunks.get(0));
    }

    static String formatExcerpt(KnowledgeChunk chunk) {
        String text = chunk.getChunkText() == null ? "" : chunk.getChunkText().trim();
        String title = displayTitle(chunk.getDocTitle());
        if (title.isEmpty()) {
            return text;
        }
        return "【" + title + "】\n\n" + text;
    }

    static String displayTitle(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }
        String t = title.trim();
        if (t.startsWith(GUIDE_TITLE_PREFIX)) {
            return t.substring(GUIDE_TITLE_PREFIX.length()).trim();
        }
        return t;
    }
}
