package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.KnowledgeDocSaveRequest;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.entity.KnowledgeDoc;
import com.shuyuan.backend.mapper.KnowledgeChunkMapper;
import com.shuyuan.backend.mapper.KnowledgeDocMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeServiceTest {

    @Mock
    private KnowledgeDocMapper knowledgeDocMapper;
    @Mock
    private KnowledgeChunkMapper knowledgeChunkMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    private KnowledgeService knowledgeService;

    @BeforeEach
    void setUp() {
        doNothing().when(adminPermissionService).require("admin:super");
        knowledgeService = new KnowledgeService(
                knowledgeDocMapper, knowledgeChunkMapper, adminPermissionService);
    }

    @Test
    void ingestTextDoc_savesContentAndChunks() {
        KnowledgeDocSaveRequest req = request("阳明心学", "知行合一强调实践与认知统一。".repeat(30));
        doAnswer(inv -> {
            KnowledgeDoc doc = inv.getArgument(0);
            doc.setId(10L);
            return 1;
        }).when(knowledgeDocMapper).insert(any(KnowledgeDoc.class));

        Map<String, Object> vo = knowledgeService.ingestTextDoc(req);

        ArgumentCaptor<KnowledgeDoc> docCap = ArgumentCaptor.forClass(KnowledgeDoc.class);
        verify(knowledgeDocMapper).insert(docCap.capture());
        assertEquals("阳明心学", docCap.getValue().getTitle());
        assertTrue(docCap.getValue().getContent().length() > 100);
        assertEquals("ready", docCap.getValue().getStatus());

        verify(knowledgeChunkMapper, atLeastOnce()).insert(any(KnowledgeChunk.class));
        assertEquals("ready", vo.get("status"));
        assertTrue((Integer) vo.get("chunkCount") >= 1);
    }

    @Test
    void ingestTextDoc_rejectsBlankContent() {
        KnowledgeDocSaveRequest req = request("空文档", "   ");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> knowledgeService.ingestTextDoc(req));
        assertEquals(400, ex.getCode());
        verify(knowledgeDocMapper, never()).insert(any(KnowledgeDoc.class));
    }

    @Test
    void updateTextDoc_replacesChunksAndPersistsContent() {
        KnowledgeDoc existing = doc(5L, "旧标题", null);
        when(knowledgeDocMapper.selectById(5L)).thenReturn(existing);

        KnowledgeDocSaveRequest req = request("新标题", "更新后的正文内容。".repeat(40));
        Map<String, Object> vo = knowledgeService.updateTextDoc(5L, req);

        verify(knowledgeChunkMapper).delete(any(LambdaQueryWrapper.class));
        verify(knowledgeChunkMapper, atLeastOnce()).insert(any(KnowledgeChunk.class));

        ArgumentCaptor<KnowledgeDoc> updateCap = ArgumentCaptor.forClass(KnowledgeDoc.class);
        verify(knowledgeDocMapper).updateById(updateCap.capture());
        assertEquals("新标题", updateCap.getValue().getTitle());
        assertEquals(req.getContent().trim(), updateCap.getValue().getContent());
        assertEquals("ready", updateCap.getValue().getStatus());
        assertEquals("ready", vo.get("status"));
    }

    @Test
    void docDetail_returnsStoredContent() {
        KnowledgeDoc doc = doc(7L, "标题", "原始正文");
        when(knowledgeDocMapper.selectById(7L)).thenReturn(doc);

        Map<String, Object> detail = knowledgeService.docDetail(7L);

        assertEquals("原始正文", detail.get("content"));
        verify(knowledgeChunkMapper, never()).selectList(any());
    }

    @Test
    void docDetail_joinsChunksWhenContentMissing() {
        KnowledgeDoc doc = doc(8L, "旧资料", null);
        when(knowledgeDocMapper.selectById(8L)).thenReturn(doc);

        String part0 = "第一段正文。".repeat(20);
        String part1 = "第二段正文。".repeat(20);
        KnowledgeChunk c0 = chunk(8L, 0, part0);
        KnowledgeChunk c1 = chunk(8L, 1, part1);
        when(knowledgeChunkMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(c0, c1));

        Map<String, Object> detail = knowledgeService.docDetail(8L);

        String content = (String) detail.get("content");
        assertTrue(content.startsWith(part0.substring(0, 20)));
        assertTrue(content.contains(part1.substring(50)));
    }

    @Test
    void listChunks_returnsOrderedChunkFields() {
        KnowledgeDoc doc = doc(9L, "分段预览", "正文");
        when(knowledgeDocMapper.selectById(9L)).thenReturn(doc);
        KnowledgeChunk c0 = chunk(9L, 0, "片段A");
        c0.setKeywords("片段A");
        c0.setCharCount(3);
        when(knowledgeChunkMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(c0));

        List<Map<String, Object>> chunks = knowledgeService.listChunks(9L);

        assertEquals(1, chunks.size());
        assertEquals(0, chunks.get(0).get("chunkIndex"));
        assertEquals("片段A", chunks.get(0).get("chunkText"));
        assertEquals("片段A", chunks.get(0).get("keywords"));
        assertEquals(3, chunks.get(0).get("charCount"));
    }

    @Test
    void testRetrieve_mapsDocTitleAndScore() {
        KnowledgeDoc ready = doc(1L, "心学纲要", "正文");
        ready.setStatus("ready");
        when(knowledgeDocMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(ready));

        KnowledgeChunk hit = chunk(1L, 0, "知行合一强调实践与认知统一");
        hit.setKeywords("知行合一");
        when(knowledgeChunkMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(hit));
        when(knowledgeDocMapper.selectBatchIds(anyCollection()))
                .thenReturn(List.of(ready));

        List<Map<String, Object>> results = knowledgeService.testRetrieve("知行合一", 5);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).get("docId"));
        assertEquals("心学纲要", results.get(0).get("docTitle"));
        assertEquals(0, results.get(0).get("chunkIndex"));
        assertTrue(((Number) results.get(0).get("score")).doubleValue() > 0);
    }

    @Test
    void testRetrieve_returnsEmptyWhenNoMatch() {
        KnowledgeDoc ready = doc(2L, "空库", "正文");
        ready.setStatus("ready");
        when(knowledgeDocMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(ready));
        when(knowledgeChunkMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(chunk(2L, 0, "无关内容")));

        List<Map<String, Object>> results = knowledgeService.testRetrieve("量子物理", 5);

        assertTrue(results.isEmpty());
        verify(knowledgeDocMapper, never()).selectBatchIds(anyCollection());
    }

    @Test
    void deleteDoc_removesChunksAndDocument() {
        KnowledgeDoc doc = doc(3L, "待删", "正文");
        when(knowledgeDocMapper.selectById(3L)).thenReturn(doc);

        knowledgeService.deleteDoc(3L);

        verify(knowledgeChunkMapper).delete(any(LambdaQueryWrapper.class));
        verify(knowledgeDocMapper).deleteById(3L);
    }

    @Test
    void updateTextDoc_throwsWhenDocMissing() {
        when(knowledgeDocMapper.selectById(99L)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> knowledgeService.updateTextDoc(99L, request("x", "正文足够长。".repeat(20))));
        assertEquals(404, ex.getCode());
    }

    private KnowledgeDocSaveRequest request(String title, String content) {
        KnowledgeDocSaveRequest req = new KnowledgeDocSaveRequest();
        req.setTitle(title);
        req.setContent(content);
        return req;
    }

    private KnowledgeDoc doc(Long id, String title, String content) {
        KnowledgeDoc doc = new KnowledgeDoc();
        doc.setId(id);
        doc.setTitle(title);
        doc.setContent(content);
        doc.setStatus("ready");
        doc.setCharCount(content != null ? content.length() : 0);
        doc.setChunkCount(1);
        doc.setCreatedAt(LocalDateTime.now());
        return doc;
    }

    private KnowledgeChunk chunk(Long docId, int index, String text) {
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setDocId(docId);
        chunk.setChunkIndex(index);
        chunk.setChunkText(text);
        chunk.setCharCount(text.length());
        return chunk;
    }
}
