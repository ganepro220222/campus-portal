package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.DownloadRecord;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.DownloadRecordMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private DownloadRecordMapper downloadRecordMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;
    @Mock
    private OssService ossService;
    @Mock
    private FavoriteService favoriteService;
    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private ResourceService resourceService;

    private static final Long MEMBER_ID = 7L;
    private static final Long RESOURCE_ID = 3L;

    @BeforeEach
    void login() {
        MemberContext.setMemberId(MEMBER_ID);
    }

    @AfterEach
    void clear() {
        MemberContext.clear();
    }

    @Test
    void detail_doesNotExposeSignedFileUrls() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);
        when(categoryService.nameMap("resource")).thenReturn(Map.of());

        Map<String, Object> result = resourceService.detail(RESOURCE_ID);

        assertEquals(true, result.get("hasFile"));
        assertFalse(result.containsKey("fileUrl"));
        assertFalse(result.containsKey("previewUrl"));
        verify(ossService, never()).signUrl(anyString());
        verify(ossService, never()).signMediaUrl(anyString());
    }

    @Test
    void list_invalidCategoryFailsClosed() {
        when(categoryService.resolveFilter("resource", "已停用"))
                .thenReturn(CategoryService.CategoryFilter.invalid());

        assertTrue(resourceService.list("已停用", null).isEmpty());
        verifyNoInteractions(resourceMapper);
    }

    @Test
    void download_issuesTicketWithoutRecording() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(ossService.signMediaUrl(anyString())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = resourceService.download(RESOURCE_ID);

        assertEquals("pdf", result.get("fileType"));
        assertEquals(RESOURCE_ID, result.get("id"));
        assertEquals(12, result.get("fileSizeKb"));
        String token = String.valueOf(result.get("token"));
        assertEquals(32, token.length());
        verify(valueOps).set(
                eq(ResourceService.DOWNLOAD_TICKET_PREFIX + token),
                eq(MEMBER_ID + ":" + RESOURCE_ID),
                eq(ResourceService.DOWNLOAD_TICKET_TTL));
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
        verify(eventLogService, never()).record(anyString(), anyString(), any());
        verify(pointService, never()).award(any(), anyString());
        verify(resourceMapper, never()).incrDownloadCount(any());
    }

    @Test
    void completeDownload_recordsOnceAfterOpen() {
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(activeResource());
        when(resourceMapper.incrDownloadCount(RESOURCE_ID)).thenReturn(1);
        stubTicket("a".repeat(32), MEMBER_ID + ":" + RESOURCE_ID);

        Map<String, Object> result = resourceService.completeDownload(RESOURCE_ID, "a".repeat(32));

        assertEquals(Boolean.TRUE, result.get("recorded"));
        verify(downloadRecordMapper).insert(any(DownloadRecord.class));
        verify(eventLogService).record("download", "resource", RESOURCE_ID);
        verify(pointService).award(MEMBER_ID, "download_resource");
        verify(resourceMapper).incrDownloadCount(RESOURCE_ID);
    }

    @Test
    void completeDownload_replayIsIdempotent() {
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(activeResource());
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.getAndDelete(ResourceService.DOWNLOAD_TICKET_PREFIX + "b".repeat(32))).thenReturn(null);
        when(redis.hasKey(ResourceService.DOWNLOAD_TICKET_USED_PREFIX + "b".repeat(32))).thenReturn(true);

        Map<String, Object> result = resourceService.completeDownload(RESOURCE_ID, "b".repeat(32));

        assertEquals(Boolean.FALSE, result.get("recorded"));
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
        verify(pointService, never()).award(any(), anyString());
        verify(resourceMapper, never()).incrDownloadCount(any());
    }

    @Test
    void completeDownload_rejectsUnknownToken() {
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(activeResource());
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.getAndDelete(anyString())).thenReturn(null);
        when(redis.hasKey(anyString())).thenReturn(false);

        var ex = assertThrows(BusinessException.class,
                () -> resourceService.completeDownload(RESOURCE_ID, "c".repeat(32)));
        assertEquals(400, ex.getCode());
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
    }

    @Test
    void completeDownload_rejectsWrongResource() {
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(activeResource());
        stubTicket("d".repeat(32), MEMBER_ID + ":99");

        var ex = assertThrows(BusinessException.class,
                () -> resourceService.completeDownload(RESOURCE_ID, "d".repeat(32)));
        assertEquals(400, ex.getCode());
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
    }

    @Test
    void writeFile_requiresLogin() {
        MemberContext.clear();
        var ex = assertThrows(BusinessException.class, () -> resourceService.writeFile(RESOURCE_ID, null));
        assertEquals(401, ex.getCode());
        verifyNoInteractions(ossService);
    }

    @Test
    void writeFile_streamsPublishedResource() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);

        resourceService.writeFile(RESOURCE_ID, null);

        verify(ossService).writeObject(resource.getFileUrl(), null);
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
    }

    @Test
    void writeFileChunk_streamsRequestedRangeWithoutRecordingAgain() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);

        resourceService.writeFileChunk(RESOURCE_ID, 4_194_304L, 4_194_304, null);

        verify(ossService).writeObjectRange(
                resource.getFileUrl(), 4_194_304L, 4_194_304, null);
        verify(downloadRecordMapper, never()).insert(any(DownloadRecord.class));
    }

    @Test
    void writeFileChunk_rejectsChunkLargerThanFourMegabytes() {
        var ex = assertThrows(
                BusinessException.class,
                () -> resourceService.writeFileChunk(
                        RESOURCE_ID, 0, ResourceService.MAX_FILE_CHUNK_BYTES + 1, null));

        assertEquals(400, ex.getCode());
        verifyNoInteractions(ossService);
        verifyNoInteractions(resourceMapper);
    }

    @Test
    void download_requiresLogin() {
        MemberContext.clear();
        var ex = assertThrows(BusinessException.class, () -> resourceService.download(RESOURCE_ID));
        assertEquals(401, ex.getCode());
        verifyNoInteractions(downloadRecordMapper);
    }

    @Test
    void completeDownload_failsWhenIncrReturnsZero() {
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(activeResource());
        when(resourceMapper.incrDownloadCount(RESOURCE_ID)).thenReturn(0);
        stubTicket("e".repeat(32), MEMBER_ID + ":" + RESOURCE_ID);

        var ex = assertThrows(BusinessException.class,
                () -> resourceService.completeDownload(RESOURCE_ID, "e".repeat(32)));
        assertEquals(404, ex.getCode());
        assertTrue(ex.getMessage().contains("资源不存在"));

        ArgumentCaptor<DownloadRecord> captor = ArgumentCaptor.forClass(DownloadRecord.class);
        verify(downloadRecordMapper).insert(captor.capture());
        assertEquals(MEMBER_ID, captor.getValue().getMemberId());
    }

    @Test
    void completeDownload_requiresLogin() {
        MemberContext.clear();
        var ex = assertThrows(BusinessException.class,
                () -> resourceService.completeDownload(RESOURCE_ID, "a".repeat(32)));
        assertEquals(401, ex.getCode());
        verifyNoInteractions(downloadRecordMapper);
    }

    private void stubTicket(String token, String bound) {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.getAndDelete(ResourceService.DOWNLOAD_TICKET_PREFIX + token)).thenReturn(bound);
    }

    private Resource activeResource() {
        Resource resource = new Resource();
        resource.setId(RESOURCE_ID);
        resource.setName("测试.pdf");
        resource.setFileUrl("https://cdn.example.com/test.pdf");
        resource.setPreviewUrl("https://cdn.example.com/test.pdf");
        resource.setFileType("pdf");
        resource.setFileSizeKb(12);
        resource.setStatus(1);
        resource.setDownloadCount(10);
        return resource;
    }
}
