package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class FallbackAiServiceTest {

    private final FallbackAiService service = new FallbackAiService();

    @Test
    void 空片段走引导语() {
        String answer = service.chat("", "", List.of());
        assertFalse(answer.contains("根据平台知识库"));
        assertFalse(answer.isBlank());
    }

    @Test
    void 只回一篇并带上短标题() {
        KnowledgeChunk first = chunk("使用指南 · 活动报名", "怎么报名：先登录再点报名。");
        KnowledgeChunk second = chunk("使用指南 · 积分与徽章", "积分可以从签到获得。");
        String answer = service.chat("", "", List.of(first, second));
        assertEquals("【活动报名】\n\n怎么报名：先登录再点报名。", answer);
        assertFalse(answer.contains("积分"));
        assertFalse(answer.contains("根据平台知识库"));
        assertFalse(answer.contains("如需更深入了解"));
    }

    @Test
    void 没有使用指南前缀时保留原标题() {
        KnowledgeChunk chunk = chunk("牙舟陶数字展厅", "牙舟陶展厅支持全景浏览。");
        assertEquals("【牙舟陶数字展厅】\n\n牙舟陶展厅支持全景浏览。",
                FallbackAiService.formatExcerpt(chunk));
    }

    private static KnowledgeChunk chunk(String title, String text) {
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setDocTitle(title);
        chunk.setChunkText(text);
        return chunk;
    }
}
