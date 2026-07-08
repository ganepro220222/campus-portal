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

    private final KnowledgeDocMapper knowledgeDocMapper;
    private final KnowledgeChunkMapper knowledgeChunkMapper;
    private final AdminPermissionService adminPermissionService;

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
        doc.setCharCount(content.length());
        doc.setChunkCount(parts.size());
        doc.setStatus("processing");
        doc.setUploadedBy(AdminContext.getAdminId());
        doc.setCreatedAt(LocalDateTime.now());
        knowledgeDocMapper.insert(doc);

        int index = 0;
        for (String part : parts) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setDocId(doc.getId());
            chunk.setChunkText(part);
            chunk.setChunkIndex(index++);
            chunk.setKeywords(extractKeywords(part));
            chunk.setCharCount(part.length());
            knowledgeChunkMapper.insert(chunk);
        }

        doc.setStatus("ready");
        knowledgeDocMapper.updateById(doc);
        return toDocVo(doc);
    }

    @Transactional
    public void deleteDoc(Long id) {
        adminPermissionService.require("admin:super");
        requireDoc(id);
        knowledgeChunkMapper.delete(new LambdaQueryWrapper<KnowledgeChunk>().eq(KnowledgeChunk::getDocId, id));
        knowledgeDocMapper.deleteById(id);
    }

    /** 检索知识片段：关键词匹配打分，取 topK */
    public List<KnowledgeChunk> retrieve(String question, int topK) {
        if (question == null || question.isBlank()) {
            return List.of();
        }
        Set<String> queryTokens = tokenize(question);
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
        return scored.stream()
                .sorted(Comparator.comparingDouble(KnowledgeChunk::getScore).reversed())
                .limit(topK)
                .toList();
    }

    private double scoreChunk(KnowledgeChunk chunk, Set<String> queryTokens) {
        Set<String> hay = tokenize(chunk.getChunkText());
        if (chunk.getKeywords() != null) {
            hay.addAll(tokenize(chunk.getKeywords()));
        }
        long hits = queryTokens.stream().filter(hay::contains).count();
        return hits;
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
            case "processing" -> "处理中";
            case "failed" -> "失败";
            default -> status;
        };
    }
}
