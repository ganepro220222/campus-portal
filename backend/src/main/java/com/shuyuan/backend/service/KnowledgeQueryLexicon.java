package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.entity.KnowledgeDoc;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 问法整理：校园 FAQ / 客服知识库常用的「标准问 + 主题词 + 去壳」。
 *
 * <p>纯 n-gram 叠字会把「解绑」判成无关，又把「换手机了怎么办」叠到活动报名。
 * 这里先归一化问句、对上标准问和主题词，再把「了怎么办」这类粘连疑问片丢掉。
 */
final class KnowledgeQueryLexicon {

    private KnowledgeQueryLexicon() {
    }

    static final Set<String> QUESTION_STOP_GRAMS = Set.of(
            "怎么", "怎样", "么样", "怎么样", "怎么办", "么办", "如何",
            "什么", "为什", "什么的", "为什么", "是什", "什么时",
            "哪里", "在哪", "哪儿", "哪个", "在哪里",
            "可以", "能不", "不能", "能不能", "是不", "不是", "是不是",
            "有没", "没有", "有没有", "多少", "几个", "一下", "一点",
            "我想", "帮我", "请问", "麻烦", "谢谢",
            "这个", "那个", "这些", "那些", "怎么才", "才能");

    private static final List<String> STOP_BY_LENGTH = QUESTION_STOP_GRAMS.stream()
            .sorted(Comparator.comparingInt(String::length).reversed())
            .toList();

    private static final List<String> LEAD_PARTICLES = List.of(
            "有没有", "能不能", "会不会", "是不是", "怎么", "如何", "怎样", "可以", "能否");

    private static final String TRAIL_PARTICLES = "吗呢啊呀吧嘛";

    /**
     * 短主题词 → 资料里真实出现的说法。只扩查询，不改正文。
     */
    static final Map<String, List<String>> TOPIC_EXPAND = Map.ofEntries(
            Map.entry("积分", List.of("积分怎么获得", "积分规则")),
            Map.entry("徽章", List.of("学习徽章", "徽章怎么解锁")),
            Map.entry("收藏", List.of("怎么收藏", "取消收藏")),
            Map.entry("点赞", List.of("怎么点赞")),
            Map.entry("分享", List.of("怎么分享")),
            Map.entry("下载", List.of("资源怎么下载", "学习资源")),
            Map.entry("资源", List.of("学习资源", "资源怎么下载")),
            Map.entry("密码", List.of("忘记密码", "怎么改密码")),
            Map.entry("登录", List.of("怎么登录")),
            Map.entry("退出", List.of("退出登录")),
            Map.entry("消息", List.of("消息中心")),
            Map.entry("反馈", List.of("意见反馈", "反馈历史")),
            Map.entry("字幕", List.of("课程字幕", "课程有字幕吗")),
            Map.entry("铃铛", List.of("首页铃铛", "铃铛红点")),
            Map.entry("红点", List.of("首页铃铛", "铃铛红点")),
            Map.entry("全景", List.of("VR 全景", "怎么进入 VR")),
            Map.entry("报名", List.of("活动报名", "怎么报名")),
            Map.entry("取消", List.of("取消报名")),
            Map.entry("解绑", List.of("解绑微信")),
            Map.entry("进度", List.of("学习进度", "课程进度")),
            Map.entry("课程", List.of("怎么看课程", "课程进度")),
            Map.entry("展馆", List.of("线上展馆", "展馆有几个")),
            Map.entry("动态", List.of("怎么看动态")),
            Map.entry("搜索", List.of("怎么搜索")),
            Map.entry("隐私", List.of("隐私政策")),
            Map.entry("保存", List.of("资源怎么下载", "学习资源")));

    private static final Map<String, List<String>> QUERY_SYNONYMS = Map.ofEntries(
            Map.entry("参加", List.of("报名")),
            Map.entry("报名", List.of("参加")),
            Map.entry("展厅", List.of("展馆")),
            Map.entry("展馆", List.of("展厅")),
            Map.entry("全景", List.of("VR", "vr")),
            Map.entry("VR", List.of("全景")),
            Map.entry("vr", List.of("全景")),
            Map.entry("退掉", List.of("取消")),
            Map.entry("取消", List.of("退掉")),
            Map.entry("解绑", List.of("解绑微信")));

    static String normalize(String question) {
        if (question == null) {
            return "";
        }
        String q = question.trim().replace("？", "").replace("?", "");
        boolean changed = true;
        while (changed && !q.isEmpty()) {
            changed = false;
            for (String lead : LEAD_PARTICLES) {
                if (q.startsWith(lead) && q.length() > lead.length()) {
                    q = q.substring(lead.length());
                    changed = true;
                }
            }
            if (q.endsWith("怎么办") || q.endsWith("怎么样") || q.endsWith("如何")) {
                q = q.substring(0, q.length() - 3);
                changed = true;
            } else if (q.endsWith("了吗") || q.endsWith("了呢")) {
                q = q.substring(0, q.length() - 2);
                changed = true;
            } else if (!q.isEmpty() && TRAIL_PARTICLES.indexOf(q.charAt(q.length() - 1)) >= 0) {
                q = q.substring(0, q.length() - 1);
                changed = true;
            }
        }
        return q.trim();
    }

    static boolean isTopicQuery(String question) {
        return TOPIC_EXPAND.containsKey(normalize(question));
    }

    static boolean isGlueToken(String token) {
        if (token == null || token.isEmpty()) {
            return true;
        }
        if (QUESTION_STOP_GRAMS.contains(token)) {
            return true;
        }
        String leftover = token;
        for (String stop : STOP_BY_LENGTH) {
            leftover = leftover.replace(stop, "");
        }
        return leftover.length() < 2;
    }

    static Set<String> tokenize(String text) {
        Set<String> tokens = new HashSet<>();
        if (text == null) {
            return tokens;
        }
        String cleaned = text.toLowerCase(Locale.ROOT)
                .replaceAll("[\\p{Punct}\\s]+", " ");
        for (String part : cleaned.split(" ")) {
            if (part.length() >= 2) {
                tokens.add(part);
            }
        }
        for (int i = 0; i < text.length(); i++) {
            if (!Character.isWhitespace(text.charAt(i))) {
                for (int len = 2; len <= 4 && i + len <= text.length(); len++) {
                    tokens.add(text.substring(i, i + len));
                }
            }
        }
        return tokens;
    }

    static Set<String> expandQuery(String question) {
        String norm = normalize(question);
        Set<String> raw = new LinkedHashSet<>();
        raw.addAll(tokenize(question));
        raw.addAll(tokenize(norm));
        Set<String> content = new LinkedHashSet<>();
        for (String token : raw) {
            if (!isGlueToken(token)) {
                content.add(token);
            }
        }
        addTopicExpansions(norm, content);
        return expandSynonyms(content);
    }

    private static void addTopicExpansions(String norm, Set<String> tokens) {
        Set<String> keys = new LinkedHashSet<>();
        if (TOPIC_EXPAND.containsKey(norm)) {
            keys.add(norm);
        }
        for (String token : List.copyOf(tokens)) {
            if (TOPIC_EXPAND.containsKey(token)) {
                keys.add(token);
            }
        }
        for (String key : keys) {
            for (String phrase : TOPIC_EXPAND.get(key)) {
                tokens.addAll(tokenize(phrase));
            }
        }
    }

    private static Set<String> expandSynonyms(Set<String> tokens) {
        Set<String> out = new HashSet<>(tokens);
        for (String token : tokens) {
            for (Map.Entry<String, List<String>> entry : QUERY_SYNONYMS.entrySet()) {
                String src = entry.getKey();
                if (!token.equals(src) && !token.contains(src)) {
                    continue;
                }
                for (String dst : entry.getValue()) {
                    out.add(token.equals(src) ? dst : token.replace(src, dst));
                }
            }
        }
        return out;
    }

    static List<String> extractFaqQuestions(String text) {
        List<String> out = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return out;
        }
        for (String part : text.split("[？?]")) {
            String n = normalize(part.replace("常见问法：", "").replace("常见问法:", ""));
            if (n.length() >= 2 && n.length() <= 24) {
                out.add(n);
            }
        }
        return out;
    }

    static boolean faqMatches(String normQuery, String normFaq) {
        if (normQuery == null || normFaq == null || normQuery.isEmpty() || normFaq.isEmpty()) {
            return false;
        }
        if (normQuery.equals(normFaq)) {
            return true;
        }
        if (normQuery.length() >= 4 && normQuery.contains(normFaq) && normFaq.length() >= 4) {
            return true;
        }
        if (normFaq.contains(normQuery) && (normQuery.length() >= 4 || TOPIC_EXPAND.containsKey(normQuery))) {
            return true;
        }
        return false;
    }

    static Long matchFaqDocId(String question, List<KnowledgeDoc> docs, List<KnowledgeChunk> chunks) {
        String norm = normalize(question);
        if (norm.isEmpty()) {
            return null;
        }
        int bestLen = -1;
        Long bestId = null;
        if (docs != null) {
            for (KnowledgeDoc doc : docs) {
                if (doc.getTitle() == null) {
                    continue;
                }
                String title = normalize(doc.getTitle().replace("使用指南 · ", ""));
                if (faqMatches(norm, title) && title.length() > bestLen) {
                    bestLen = title.length();
                    bestId = doc.getId();
                }
            }
        }
        if (chunks == null) {
            return bestId;
        }
        for (KnowledgeChunk chunk : chunks) {
            for (String faq : extractFaqQuestions(chunk.getChunkText())) {
                if (faqMatches(norm, faq) && faq.length() > bestLen) {
                    bestLen = faq.length();
                    bestId = chunk.getDocId();
                }
            }
        }
        return bestId;
    }

    static boolean looksLikeContent(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return text.contains("。") || text.contains("：");
    }
}
