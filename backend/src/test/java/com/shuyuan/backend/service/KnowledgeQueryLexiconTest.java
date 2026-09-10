package com.shuyuan.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KnowledgeQueryLexiconTest {

    @Test
    void 问句去壳留下主题() {
        assertEquals("取消报名", KnowledgeQueryLexicon.normalize("可以取消报名吗"));
        assertEquals("微信能解绑", KnowledgeQueryLexicon.normalize("微信能解绑吗"));
        assertEquals("字幕", KnowledgeQueryLexicon.normalize("有没有字幕"));
        assertEquals("积分", KnowledgeQueryLexicon.normalize("积分"));
        assertEquals("换手机了", KnowledgeQueryLexicon.normalize("换手机了怎么办"));
    }

    @Test
    void 了怎么办是粘连片() {
        assertTrue(KnowledgeQueryLexicon.isGlueToken("了怎么办"));
        assertTrue(KnowledgeQueryLexicon.isGlueToken("怎么办"));
        assertFalse(KnowledgeQueryLexicon.isGlueToken("积分"));
        assertFalse(KnowledgeQueryLexicon.isGlueToken("解绑微信"));
    }

    @Test
    void 短主题词能对上标准问() {
        assertTrue(KnowledgeQueryLexicon.faqMatches("积分", "积分怎么获得"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("登录", "怎么登录"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("文创", "文创在哪里看"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("提意见", "提意见"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("资料在哪", "资料在哪"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("VR怎么看", "VR怎么看"));
        assertTrue(KnowledgeQueryLexicon.faqMatches("通知在哪", "通知在哪"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("提意见", "提交意见反馈"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("几个", "展馆有几个"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("天气", "怎么报名"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("资料在哪", "资源怎么下载"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("VR怎么看", "怎么进入 VR"));
        assertFalse(KnowledgeQueryLexicon.faqMatches("通知在哪", "怎么看通知"));
    }

    @Test
    void 切段残片不能把积分标准问算到课程篇() {
        var faqs = KnowledgeQueryLexicon.extractFaqQuestions(
                "见积分与徽章相关说明。\n\n常见问法：怎么看课程？课程进度怎么算？");
        assertTrue(faqs.contains("怎么看课程"));
        assertTrue(faqs.contains("课程进度怎么算"));
        assertTrue(faqs.stream().noneMatch(f -> f.contains("积分")),
                "残片不得带着「积分」当标准问：" + faqs);
    }
}
