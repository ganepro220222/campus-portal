package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.KnowledgeDocSaveRequest;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.entity.KnowledgeDoc;
import com.shuyuan.backend.mapper.KnowledgeChunkMapper;
import com.shuyuan.backend.mapper.KnowledgeDocMapper;
import com.shuyuan.backend.util.FormatUtils;
import com.shuyuan.backend.util.TextChunker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private static final int DEFAULT_RETRIEVE_TOP_K = 5;
    private static final int MAX_RETRIEVE_TOP_K = 20;

    private final KnowledgeDocMapper knowledgeDocMapper;
    private final KnowledgeChunkMapper knowledgeChunkMapper;
    private final AdminPermissionService adminPermissionService;
    private final OssMediaCleanupService ossMediaCleanupService;

    public PageResult<Map<String, Object>> listDocs(int page, int size) {
        adminPermissionService.require("admin:super");
        var p = knowledgeDocMapper.selectPage(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size),
                new LambdaQueryWrapper<KnowledgeDoc>().orderByDesc(KnowledgeDoc::getCreatedAt));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toDocVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> docStatus(Long id) {
        adminPermissionService.require("admin:super");
        return toDocVo(requireDoc(id));
    }

    @Transactional
    public Map<String, Object> ingestTextDoc(KnowledgeDocSaveRequest req) {
        adminPermissionService.require("admin:super");
        String title = req.getTitle().trim();
        String content = req.getContent().trim();
        List<String> parts = TextChunker.split(content);
        if (parts.isEmpty()) {
            throw new BusinessException(400, "正文过短，无法入库");
        }

        KnowledgeDoc doc = new KnowledgeDoc();
        doc.setTitle(title);
        doc.setFileUrl("manual://" + title);
        doc.setSourceType("manual");
        doc.setContent(content);
        doc.setCharCount(content.length());
        doc.setChunkCount(parts.size());
        doc.setStatus("processing");
        doc.setUploadedBy(AdminContext.getAdminId());
        doc.setCreatedAt(LocalDateTime.now());
        knowledgeDocMapper.insert(doc);

        rebuildChunks(doc.getId(), parts);

        doc.setStatus("ready");
        knowledgeDocMapper.updateById(doc);
        return toDocVo(doc);
    }

    /** 编辑：更新标题/正文并重新分段入库（关键词检索无需嵌入，重建成本低）。 */
    @Transactional
    public Map<String, Object> updateTextDoc(Long id, KnowledgeDocSaveRequest req) {
        adminPermissionService.require("admin:super");
        KnowledgeDoc doc = requireDoc(id);
        String title = req.getTitle().trim();
        String content = req.getContent().trim();
        List<String> parts = TextChunker.split(content);
        if (parts.isEmpty()) {
            throw new BusinessException(400, "正文过短，无法入库");
        }
        // 保留停用意图：停用中的文档编辑后仍停用，不因编辑被静默重新启用
        boolean wasDisabled = "disabled".equals(doc.getStatus());
        knowledgeChunkMapper.delete(new LambdaQueryWrapper<KnowledgeChunk>().eq(KnowledgeChunk::getDocId, id));
        rebuildChunks(id, parts);

        doc.setTitle(title);
        doc.setContent(content);
        doc.setCharCount(content.length());
        doc.setChunkCount(parts.size());
        doc.setStatus(wasDisabled ? "disabled" : "ready");
        knowledgeDocMapper.updateById(doc);
        return toDocVo(doc);
    }

    /**
     * 启用/停用：停用后不参与 AI 检索（retrieve 只取 ready），但保留文档与分段，可随时启用。
     * 仅在 ready ↔ disabled 之间切换，避免对处理中/失败态做无意义变更。
     */
    @Transactional
    public Map<String, Object> setEnabled(Long id, boolean enabled) {
        adminPermissionService.require("admin:super");
        KnowledgeDoc doc = requireDoc(id);
        if (enabled) {
            if (!"disabled".equals(doc.getStatus())) {
                throw new BusinessException(400, "该文档当前不是停用状态");
            }
            doc.setStatus("ready");
        } else {
            if (!"ready".equals(doc.getStatus())) {
                throw new BusinessException(400, "仅「已就绪」文档可停用");
            }
            doc.setStatus("disabled");
        }
        knowledgeDocMapper.updateById(doc);
        return toDocVo(doc);
    }

    private void rebuildChunks(Long docId, List<String> parts) {
        int index = 0;
        for (String part : parts) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setDocId(docId);
            chunk.setChunkText(part);
            chunk.setChunkIndex(index++);
            chunk.setKeywords(extractKeywords(part));
            chunk.setCharCount(part.length());
            knowledgeChunkMapper.insert(chunk);
        }
    }

    /** 编辑回填：返回标题 + 原始正文（旧数据无 content 时由分段近似还原）。 */
    public Map<String, Object> docDetail(Long id) {
        adminPermissionService.require("admin:super");
        KnowledgeDoc doc = requireDoc(id);
        Map<String, Object> m = toDocVo(doc);
        String content = doc.getContent();
        boolean contentRecovered = false;
        if (content == null || content.isBlank()) {
            List<KnowledgeChunk> chunks = chunksOf(id);
            content = TextChunker.join(chunks.stream().map(KnowledgeChunk::getChunkText).toList());
            contentRecovered = true;
        }
        m.put("content", content);
        m.put("contentRecovered", contentRecovered);
        return m;
    }

    /** 查看分段：返回该文档的所有片段（序号、正文、关键词、字数）。 */
    public List<Map<String, Object>> listChunks(Long id) {
        adminPermissionService.require("admin:super");
        requireDoc(id);
        return chunksOf(id).stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("chunkIndex", c.getChunkIndex());
            m.put("chunkText", c.getChunkText());
            m.put("keywords", c.getKeywords());
            m.put("charCount", c.getCharCount());
            return m;
        }).toList();
    }

    /** 检索自测「试问」：返回命中的片段及所属文档、得分（用于调优）。 */
    public List<Map<String, Object>> testRetrieve(String question, int topK) {
        adminPermissionService.require("admin:super");
        List<KnowledgeChunk> hits = retrieve(question, topK);
        if (hits.isEmpty()) {
            return List.of();
        }
        return hits.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("docId", c.getDocId());
            m.put("docTitle", c.getDocTitle() == null || c.getDocTitle().isBlank()
                    ? "（已删除）" : c.getDocTitle());
            m.put("chunkIndex", c.getChunkIndex());
            m.put("chunkText", c.getChunkText());
            m.put("score", c.getScore());
            return m;
        }).toList();
    }

    private List<KnowledgeChunk> chunksOf(Long docId) {
        return knowledgeChunkMapper.selectList(new LambdaQueryWrapper<KnowledgeChunk>()
                .eq(KnowledgeChunk::getDocId, docId)
                .orderByAsc(KnowledgeChunk::getChunkIndex));
    }

    @Transactional
    public void deleteDoc(Long id) {
        adminPermissionService.require("admin:super");
        KnowledgeDoc doc = requireDoc(id);
        List<String> media = new ArrayList<>();
        if (doc.getFileUrl() != null) {
            media.add(doc.getFileUrl());
        }
        if (doc.getContent() != null) {
            media.add(doc.getContent());
        }
        knowledgeChunkMapper.delete(new LambdaQueryWrapper<KnowledgeChunk>().eq(KnowledgeChunk::getDocId, id));
        knowledgeDocMapper.deleteById(id);
        ossMediaCleanupService.releaseStored(media);
    }

    /** 检索知识片段：关键词匹配打分，取 topK */
    public List<KnowledgeChunk> retrieve(String question, int topK) {
        if (question == null || question.isBlank()) {
            return List.of();
        }
        Set<String> queryTokens = queryTokens(question);
        if (queryTokens.isEmpty()) {
            return List.of();
        }
        List<KnowledgeDoc> readyDocs = knowledgeDocMapper.selectList(
                new LambdaQueryWrapper<KnowledgeDoc>().eq(KnowledgeDoc::getStatus, "ready"));
        if (readyDocs.isEmpty()) {
            return List.of();
        }
        Set<Long> docIds = readyDocs.stream().map(KnowledgeDoc::getId).collect(Collectors.toSet());
        List<KnowledgeChunk> candidates = knowledgeChunkMapper.selectList(
                new LambdaQueryWrapper<KnowledgeChunk>().in(KnowledgeChunk::getDocId, docIds));
        List<KnowledgeChunk> scored = new ArrayList<>();
        for (KnowledgeChunk chunk : candidates) {
            double score = scoreChunk(chunk, queryTokens);
            if (score > 0) {
                chunk.setScore(score);
                scored.add(chunk);
            }
        }
        List<KnowledgeChunk> top = scored.stream()
                .sorted(Comparator.comparingDouble(KnowledgeChunk::getScore).reversed())
                .limit(clampTopK(topK))
                .collect(Collectors.toList());
        attachDocTitles(top);
        return top;
    }

    /**
     * 在已检索的片段里挑最能回答的一篇：先比加权分，再比原始命中数。
     * 学生问答只展示这一篇，避免把三篇弱相关拼成一段「整理如下」。
     */
    public KnowledgeChunk pickBest(String question, List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return null;
        }
        Set<String> tokens = queryTokens(question);
        return chunks.stream()
                .max(Comparator
                        .comparingInt((KnowledgeChunk c) -> weightedScore(c, tokens))
                        .thenComparingDouble(KnowledgeChunk::getScore))
                .orElse(chunks.get(0));
    }

    private void attachDocTitles(List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return;
        }
        Set<Long> ids = chunks.stream().map(KnowledgeChunk::getDocId).collect(Collectors.toSet());
        Map<Long, String> titles = knowledgeDocMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(KnowledgeDoc::getId, KnowledgeDoc::getTitle, (a, b) -> a));
        for (KnowledgeChunk chunk : chunks) {
            chunk.setDocTitle(titles.get(chunk.getDocId()));
        }
    }

    /**
     * 本次检索是否真的捞到了能用来回答的资料。
     *
     * <p>为什么不能直接用 {@code chunks.isEmpty()} 判断：打分是 2–4 字字符 n-gram 的重合数，
     * 只要有一个 gram 重合分数就大于 0。实测「比利时的首都在哪」「明天天气怎么样」这类
     * 完全无关的问题也能命中 5 段（靠的是「怎么」「么样」这种到处都有的短词），
     * 所以 isEmpty 几乎永远不成立，据此做判断等于没做。
     *
     * <p>这里换一套只用于「够不够格」判断的加权分：命中越长的 gram 权重越高
     * （4 字的「报名活动」显然比 2 字的「怎么」有说服力，权重 3 : 1）。
     * 不够格时学生问答给固定引导语，不展示弱相关摘录。
     *
     * @param minScore 加权分下限，低于它视为没有实质资料
     */
    public boolean hasSubstantialMatch(String question, List<KnowledgeChunk> chunks, int minScore) {
        if (chunks == null || chunks.isEmpty() || question == null || question.isBlank()) {
            return false;
        }
        Set<String> queryTokens = queryTokens(question);
        if (queryTokens.isEmpty()) {
            return false;
        }
        for (KnowledgeChunk chunk : chunks) {
            if (weightedScore(chunk, queryTokens) >= minScore) {
                return true;
            }
        }
        return false;
    }

    /**
     * 疑问词与功能词：出现在任何一句中文提问里，和问的是什么毫无关系。
     *
     * <p>实测「我心情不好怎么办」能拿到 5 分、「附近有什么好吃的」4 分，靠的全是
     * 「怎么办」「有什么」这种词——分数比真问题「手机上怎么把资料保存下来」（3 分）还高，
     * 光调阈值永远分不开。计「够不够格」时把这些词剔掉，剩下的才是话题信号。
     *
     * <p>只用于 {@link #hasSubstantialMatch}，不影响 {@link #retrieve} 的排序。
     */

    /**
     * 问法侧的小同义表，只扩查询词，不改文档正文。
     * 成对出现：参加↔报名、展厅↔展馆、全景↔VR、退掉↔取消。
     */
    private static final Map<String, List<String>> QUERY_SYNONYMS = Map.of(
            "参加", List.of("报名"),
            "报名", List.of("参加"),
            "展厅", List.of("展馆"),
            "展馆", List.of("展厅"),
            "全景", List.of("VR", "vr"),
            "VR", List.of("全景"),
            "vr", List.of("全景"),
            "退掉", List.of("取消"),
            "取消", List.of("退掉"));

    private static final Set<String> QUESTION_STOP_GRAMS = Set.of(
            "怎么", "怎样", "么样", "怎么样", "怎么办", "么办", "如何",
            "什么", "为什", "什么的", "为什么", "是什", "什么时",
            "哪里", "在哪", "哪儿", "哪个", "在哪里",
            "可以", "能不", "不能", "能不能", "是不", "不是", "是不是",
            "有没", "没有", "有没有", "多少", "几个", "一下", "一点",
            "我想", "帮我", "请问", "麻烦", "谢谢",
            "这个", "那个", "这些", "那些", "怎么才", "才能");

    /** 命中 gram 越长权重越高：2 字记 1 分、3 字记 2 分、4 字记 3 分；疑问词不计分 */
    int weightedScore(KnowledgeChunk chunk, Set<String> queryTokens) {
        Set<String> hay = tokenize(chunk.getChunkText());
        if (chunk.getKeywords() != null) {
            hay.addAll(tokenize(chunk.getKeywords()));
        }
        int score = 0;
        for (String token : queryTokens) {
            if (QUESTION_STOP_GRAMS.contains(token)) {
                continue;
            }
            if (hay.contains(token)) {
                score += token.length() - 1;
            }
        }
        return score;
    }

    private int clampTopK(int topK) {
        return topK <= 0 ? DEFAULT_RETRIEVE_TOP_K : Math.min(topK, MAX_RETRIEVE_TOP_K);
    }

    private double scoreChunk(KnowledgeChunk chunk, Set<String> queryTokens) {
        Set<String> hay = tokenize(chunk.getChunkText());
        if (chunk.getKeywords() != null) {
            hay.addAll(tokenize(chunk.getKeywords()));
        }
        long hits = queryTokens.stream().filter(hay::contains).count();
        return hits;
    }

    private Set<String> queryTokens(String question) {
        return expandSynonyms(tokenize(question));
    }

    private Set<String> expandSynonyms(Set<String> tokens) {
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

    private Set<String> tokenize(String text) {
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

    private String extractKeywords(String text) {
        return text.length() > 80 ? text.substring(0, 80) : text;
    }

    private KnowledgeDoc requireDoc(Long id) {
        KnowledgeDoc doc = knowledgeDocMapper.selectById(id);
        if (doc == null) {
            throw new BusinessException(404, "知识库文档不存在");
        }
        return doc;
    }

    private Map<String, Object> toDocVo(KnowledgeDoc doc) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", doc.getId());
        m.put("title", doc.getTitle());
        m.put("status", doc.getStatus());
        m.put("statusLabel", statusLabel(doc.getStatus()));
        m.put("charCount", doc.getCharCount());
        m.put("chunkCount", doc.getChunkCount());
        m.put("createdAt", FormatUtils.formatDateTime(doc.getCreatedAt()));
        return m;
    }

    private String statusLabel(String status) {
        if (status == null) {
            return "未知";
        }
        return switch (status) {
            case "ready" -> "已就绪";
            case "disabled" -> "已停用";
            case "processing" -> "处理中";
            case "failed" -> "失败";
            default -> status;
        };
    }
}
