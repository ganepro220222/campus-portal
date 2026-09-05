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
        String text = visibleExcerpt(chunk.getChunkText());
        String title = displayTitle(chunk.getDocTitle());
        if (title.isEmpty()) {
            return text;
        }
        if (text.isEmpty()) {
            return "【" + title + "】";
        }
        return "【" + title + "】\n\n" + text;
    }

    /**
     * 文首问句和文末「常见问法」是给检索用的，不是给学生看的答案。
     * 现在学生端原样返回摘录，不剥掉就会把整串问题念出来。
     */
    static String visibleExcerpt(String raw) {
        if (raw == null) {
            return "";
        }
        String text = raw.trim();
        int faq = text.indexOf("常见问法：");
        if (faq >= 0) {
            text = text.substring(0, faq).trim();
        }
        String[] paras = text.split("\\n\\n+", 2);
        if (isQuestionDump(paras[0])) {
            return paras.length > 1 ? paras[1].trim() : "";
        }
        return text;
    }

    static boolean isQuestionDump(String para) {
        if (para == null) {
            return false;
        }
        String t = para.replace('\n', ' ').trim();
        if (t.isEmpty() || t.contains("：") || t.contains("。")) {
            return false;
        }
        int marks = t.length() - t.replace("？", "").length();
        return marks >= 2 && t.endsWith("？");
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
