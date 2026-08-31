package com.shuyuan.backend.service;

import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.mapper.OssMediaRefMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OssMediaCleanupServiceTest {

    @Mock
    private OssService ossService;
    @Mock
    private OssMediaRefMapper refMapper;
    @Mock
    private OssProperties ossProperties;

    @InjectMocks
    private OssMediaCleanupService cleanup;

    @BeforeEach
    void defaults() {
        // 无事务时 afterReplace 立即执行
    }

    @Test
    void afterReplace_skipsWhenSameOrBlank() {
        cleanup.afterReplace("videos/202608/a.mp4", "https://cdn.yunmanvr.com/videos/202608/a.mp4");
        cleanup.afterReplace(null, "videos/202608/b.mp4");
        cleanup.afterReplace("videos/202608/a.mp4", "videos/202608/a.mp4");
        verify(refMapper, never()).countReferences(anyString());
        verify(ossService, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void afterReplace_skipsWhenStillReferenced() {
        when(refMapper.countReferences("images/202608/old.jpg")).thenReturn(2L);

        cleanup.afterReplace("images/202608/old.jpg", "images/202608/new.jpg");

        verify(ossService, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void afterReplace_deletesWhenUnreferenced() {
        when(refMapper.countReferences("images/202608/old.jpg")).thenReturn(0L);
        when(ossService.deleteObjectQuietly("images/202608/old.jpg")).thenReturn(true);

        cleanup.afterReplace("https://cdn.yunmanvr.com/images/202608/old.jpg",
                "https://cdn.yunmanvr.com/images/202608/new.jpg");

        verify(ossService).deleteObjectQuietly("images/202608/old.jpg");
    }

    @Test
    void afterReplace_ignoresOssFailure() {
        when(refMapper.countReferences("videos/202608/old.mp4")).thenReturn(0L);
        when(ossService.deleteObjectQuietly("videos/202608/old.mp4")).thenReturn(false);

        assertDoesNotThrow(() -> cleanup.afterReplace("videos/202608/old.mp4", "videos/202608/new.mp4"));
    }

    @Test
    void afterReplace_neverTouchesStudioPrefix() {
        cleanup.afterReplace("craft-demo/model.glb", "images/202608/cover.jpg");
        verify(refMapper, never()).countReferences(anyString());
        verify(ossService, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void collectStoredFor_courseFlattensRow() {
        when(refMapper.findCourseMedia(8L)).thenReturn(Map.of(
                "cover", "images/202608/c.jpg",
                "video_url", "videos/202608/v.mp4"));

        List<String> blobs = cleanup.collectStoredFor("course", 8L);

        assertEquals(2, blobs.size());
        assertEquals(true, blobs.contains("images/202608/c.jpg"));
        assertEquals(true, blobs.contains("videos/202608/v.mp4"));
    }

    @Test
    void sweepOrphans_abortsWhenOverCap() {
        when(ossService.isEnabled()).thenReturn(true);
        when(ossProperties.isOrphanSweepEnabled()).thenReturn(true);
        when(ossProperties.getOrphanMinAgeHours()).thenReturn(48);
        when(ossProperties.getOrphanSweepMaxDeletes()).thenReturn(1);
        Date old = new Date(System.currentTimeMillis() - 72L * 3600_000);
        when(ossService.listManagedObjects()).thenReturn(List.of(
                new OssService.ManagedObject("images/202607/a.jpg", old),
                new OssService.ManagedObject("images/202607/b.jpg", old)));
        when(refMapper.countReferences(anyString())).thenReturn(0L);

        OssMediaCleanupService.SweepReport report = cleanup.sweepOrphans(false);

        assertEquals("cap-exceeded", report.skippedReason);
        assertEquals(2, report.candidateCount);
        verify(ossService, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void sweepOrphans_skipsFreshUploads() {
        when(ossService.isEnabled()).thenReturn(true);
        when(ossProperties.isOrphanSweepEnabled()).thenReturn(true);
        when(ossProperties.getOrphanMinAgeHours()).thenReturn(48);
        when(ossProperties.getOrphanSweepMaxDeletes()).thenReturn(80);
        Date fresh = new Date();
        when(ossService.listManagedObjects()).thenReturn(List.of(
                new OssService.ManagedObject("videos/202608/new.mp4", fresh)));

        OssMediaCleanupService.SweepReport report = cleanup.sweepOrphans(false);

        assertEquals(1, report.tooNew);
        assertEquals(0, report.deleted);
        verify(refMapper, never()).countReferences(anyString());
        verify(ossService, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void sweepOrphans_deletesUnreferencedOldObject() {
        when(ossService.isEnabled()).thenReturn(true);
        when(ossProperties.isOrphanSweepEnabled()).thenReturn(true);
        when(ossProperties.getOrphanMinAgeHours()).thenReturn(48);
        when(ossProperties.getOrphanSweepMaxDeletes()).thenReturn(80);
        Date old = new Date(System.currentTimeMillis() - 72L * 3600_000);
        when(ossService.listManagedObjects()).thenReturn(List.of(
                new OssService.ManagedObject("files/202607/gone.pdf", old)));
        when(refMapper.countReferences("files/202607/gone.pdf")).thenReturn(0L);
        when(ossService.deleteObjectQuietly("files/202607/gone.pdf")).thenReturn(true);

        OssMediaCleanupService.SweepReport report = cleanup.sweepOrphans(false);

        assertEquals(1, report.deleted);
        verify(ossService).deleteObjectQuietly("files/202607/gone.pdf");
    }

    @Test
    void sweepOrphans_keepsObjectWhenLastModifiedUnknown() {
        when(ossService.isEnabled()).thenReturn(true);
        when(ossProperties.isOrphanSweepEnabled()).thenReturn(true);
        when(ossProperties.getOrphanMinAgeHours()).thenReturn(48);
        when(ossProperties.getOrphanSweepMaxDeletes()).thenReturn(80);
        when(ossService.listManagedObjects()).thenReturn(List.of(
                new OssService.ManagedObject("images/202607/unknown.jpg", null)));

        OssMediaCleanupService.SweepReport report = cleanup.sweepOrphans(false);

        assertEquals(1, report.tooNew);
        verify(ossService, never()).deleteObjectQuietly(anyString());
    }
}
