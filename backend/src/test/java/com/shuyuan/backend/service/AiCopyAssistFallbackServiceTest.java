package com.shuyuan.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiCopyAssistFallbackServiceTest {

    private final AiCopyAssistFallbackService service = new AiCopyAssistFallbackService();

    @Test
    void polish_addsCulturalPrefix() {
        String result = service.transform("polish", "书院举办讲座");
        assertTrue(result.startsWith("承书院文脉"));
        assertTrue(result.contains("书院举办讲座"));
    }

    @Test
    void summarize_truncatesLongText() {
        String longText = "甲".repeat(80);
        String result = service.transform("summarize", longText);
        assertTrue(result.length() <= 51);
    }

    @Test
    void title_returnsThreeSuggestions() {
        String result = service.transform("title", "交通职业大学举办非遗展览");
        assertTrue(result.contains("1."));
        assertTrue(result.contains("2."));
        assertTrue(result.contains("3."));
    }

    @Test
    void expand_appendsCulturalParagraph() {
        String result = service.transform("expand", "书院新展开放");
        assertTrue(result.contains("书院新展开放"));
        assertTrue(result.contains("中华优秀传统文化"));
    }
}
