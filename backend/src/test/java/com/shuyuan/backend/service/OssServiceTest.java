package com.shuyuan.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.ObjectMetadata;
import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.entity.OssObjectMeta;
import com.shuyuan.backend.mapper.OssObjectMetaMapper;
import com.shuyuan.backend.util.CdnUrlAuth;
import com.shuyuan.backend.util.Mp4TestFixtures;
import com.shuyuan.backend.util.OssPostPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * OSS 白名单与未配置场景
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OssServiceTest {

    @Mock
    private OssProperties ossProperties;

    @Mock
    private OssObjectMetaMapper ossObjectMetaMapper;

    @InjectMocks
    private OssService ossService;

    @BeforeEach
    void setUp() {
        when(ossProperties.isEnabled()).thenReturn(false);
    }

    @Test
    void signUrl_passthrough_whenDisabled() {
        String raw = "https://cdn.example.com/videos/demo.mp4";
        assertEquals(raw, ossService.signUrl(raw));
        assertEquals(raw, ossService.signMediaUrl(raw));
        assertEquals(raw, ossService.signVideoUrl(raw));
    }

    @Test
    void signUrl_usesUnsignedCdn_forPublicAssets() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("yunman-shuyuan");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");

        assertEquals(
                "https://cdn.yunmanvr.com/images/202608/cover.jpg",
                ossService.signUrl("images/202608/cover.jpg"));
    }

    @Test
    void signMediaUrl_usesOssPresign_notBareCdn_whenCdnAuthOff() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("yunman-shuyuan");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        lenient().when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");
        when(ossProperties.isCdnAuthEnabled()).thenReturn(false);
        when(ossProperties.getMediaSignExpireSeconds()).thenReturn(900);

        String media = ossService.signMediaUrl("videos/202608/abc.mp4");
        assertTrue(media.contains("oss-cn-chengdu.aliyuncs.com"), media);
        assertTrue(media.contains("Expires="), media);
        assertTrue(media.contains("Signature="), media);
        assertFalse(media.contains("cdn.yunmanvr.com"), media);
        long now = System.currentTimeMillis() / 1000L;
        String expires = media.replaceFirst(".*[?&]Expires=(\\d+).*", "$1");
        long exp = Long.parseLong(expires);
        assertTrue(exp >= now + 890 && exp <= now + 910, "Expires=" + expires);

        String fromCdnStored = ossService.signMediaUrl("https://cdn.yunmanvr.com/videos/202608/abc.mp4");
        assertTrue(fromCdnStored.contains("oss-cn-chengdu.aliyuncs.com"), fromCdnStored);
        assertFalse(fromCdnStored.contains("cdn.yunmanvr.com/videos"), fromCdnStored);
    }

    @Test
    void signUrl_usesOssPresign_forProtectedPath_whenCdnAuthIsIncomplete() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("yunman-shuyuan");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");
        when(ossProperties.isCdnAuthEnabled()).thenReturn(true);
        when(ossProperties.getCdnAuthKey()).thenReturn("");
        when(ossProperties.getSignExpireSeconds()).thenReturn(7200);

        String preview = ossService.signUrl("videos/202608/abc.mp4");

        assertTrue(preview.contains("oss-cn-chengdu.aliyuncs.com"), preview);
        assertTrue(preview.contains("Signature="), preview);
        assertFalse(preview.contains("cdn.yunmanvr.com"), preview);
    }

    @Test
    void signMediaUrl_usesCdnTypeA_whenAuthConfigured() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("yunman-shuyuan");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");
        when(ossProperties.isCdnAuthEnabled()).thenReturn(true);
        when(ossProperties.getCdnAuthType()).thenReturn("A");
        when(ossProperties.getCdnAuthKey()).thenReturn("aliyuncdnexp1234");
        when(ossProperties.getMediaSignExpireSeconds()).thenReturn(900);
        when(ossProperties.getVideoSignExpireSeconds()).thenReturn(14_400);
        when(ossProperties.getSignExpireSeconds()).thenReturn(7200);

        String media = ossService.signMediaUrl("videos/202608/abc.mp4");
        assertTrue(media.startsWith("https://cdn.yunmanvr.com/videos/202608/abc.mp4?auth_key="), media);
        assertFalse(media.contains("OSSAccessKeyId"), media);
        String authKey = media.substring(media.indexOf("auth_key=") + "auth_key=".length());
        String[] parts = authKey.split("-", 4);
        assertEquals(4, parts.length);
        long expireAt = Long.parseLong(parts[0]);
        long now = System.currentTimeMillis() / 1000L;
        assertTrue(expireAt >= now + 890 && expireAt <= now + 910, "expireAt=" + expireAt);
        assertEquals(
                CdnUrlAuth.signTypeA(
                        "https://cdn.yunmanvr.com",
                        "videos/202608/abc.mp4",
                        "aliyuncdnexp1234",
                        expireAt,
                        parts[1],
                        parts[2]),
                media);

        String video = ossService.signVideoUrl("videos/202608/abc.mp4");
        String videoAuth = video.substring(video.indexOf("auth_key=") + "auth_key=".length());
        long videoExp = Long.parseLong(videoAuth.split("-", 4)[0]);
        assertTrue(videoExp >= now + 14_390 && videoExp <= now + 14_410, "videoExp=" + videoExp);

        assertEquals(
                "https://cdn.yunmanvr.com/images/202608/cover.jpg",
                ossService.signUrl("images/202608/cover.jpg"));
        assertTrue(OssService.isCdnAuthProtectedObjectKey("videos/a.mp4"));
        assertTrue(OssService.isCdnAuthProtectedObjectKey("files/a.pdf"));
        assertTrue(OssService.isCdnAuthProtectedObjectKey("audios/a.mp3"));
        assertTrue(OssService.isCdnAuthProtectedObjectKey("subtitles/a.vtt"));
        assertFalse(OssService.isCdnAuthProtectedObjectKey("images/a.jpg"));
        assertFalse(OssService.isCdnAuthProtectedObjectKey("exhibits/a.glb"));
    }

    @Test
    void readUtf8Object_rejectsWhenDisabled() {
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.readUtf8Object("subtitles/a.vtt"));
        assertEquals(503, ex.getCode());
    }

    @Test
    void writeObject_rejectsWhenDisabled() {
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.writeObject("files/a.pdf", null));
        assertEquals(503, ex.getCode());
    }

    @Test
    void signTrustedVideoUrlForAsr_rejectsWhenDisabled() {
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.signTrustedVideoUrlForAsr("videos/demo.mp4"));
        assertEquals(503, ex.getCode());
    }

    @Test
    void upload_rejects_whenDisabled() {
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[]{1, 2});
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("cover", file));
        assertEquals(503, ex.getCode());
    }

    @Test
    void upload_rejects_invalidExtension_whenEnabled() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        MockMultipartFile file = new MockMultipartFile("file", "evil.php", "text/plain", new byte[]{1});
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("cover", file));
        assertEquals(400, ex.getCode());
    }

    @Test
    void upload_rejects_model3dScene_whenEnabled() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        MockMultipartFile file = new MockMultipartFile("file", "craft.glb", "model/gltf-binary", "glTF".getBytes());
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("model3d", file));
        assertEquals(400, ex.getCode());
    }

    @Test
    void upload_acceptsResourceFileMp4_whenEnabled_withoutCallingCloud() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        byte[] mp4Header = new byte[12];
        mp4Header[4] = 'f';
        mp4Header[5] = 't';
        mp4Header[6] = 'y';
        mp4Header[7] = 'p';
        MockMultipartFile file = new MockMultipartFile("file", "lecture.mp4", "video/mp4", mp4Header);
        try {
            ossService.upload("resource_file", file);
        } catch (com.shuyuan.backend.common.exception.BusinessException ex) {
            assertNotEquals(400, ex.getCode(), "resource_file 场景应允许 mp4");
        }
    }

    @Test
    void upload_acceptsExcelForResourceAndDocumentScenes() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();
        byte[] xlsHeader = new byte[]{
                (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
        };
        byte[] xlsxHeader = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00};

        for (String scene : new String[]{"resource_file", "document"}) {
            Map<String, String> xls = service.upload(scene,
                    new MockMultipartFile("file", "schedule.xls", "application/octet-stream", xlsHeader));
            Map<String, String> xlsx = service.upload(scene,
                    new MockMultipartFile("file", "schedule.xlsx", "application/octet-stream", xlsxHeader));

            assertTrue(xls.get("objectKey").startsWith("files/"));
            assertTrue(xls.get("objectKey").endsWith(".xls"));
            assertTrue(xlsx.get("objectKey").startsWith("files/"));
            assertTrue(xlsx.get("objectKey").endsWith(".xlsx"));
        }
        verify(client, times(4)).putObject(
                eq("bucket"), anyString(), any(InputStream.class), any(ObjectMetadata.class));
    }

    @Test
    void upload_rejectsJpegExtensionWithHtmlContent_whenEnabled() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.jpg", "image/jpeg", "<html>".getBytes());
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("cover", file));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("不匹配"));
    }

    @Test
    void deleteObjectQuietly_skipsWhenDisabledOrUnmanaged() {
        assertFalse(ossService.deleteObjectQuietly("videos/202608/a.mp4"));
        assertFalse(ossService.deleteObjectQuietly("craft-demo/model.glb"));
        assertFalse(ossService.deleteObjectQuietly("exhibits/hall/a.jpg"));
    }

    @Test
    void upload_rejectsResourceFilePhp_whenEnabled() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        MockMultipartFile file = new MockMultipartFile("file", "evil.php", "text/plain", new byte[]{1});
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("resource_file", file));
        assertEquals(400, ex.getCode());
    }

    @Test
    void upload_rejectsImageOverTwentyMegabytes() {
        enableOss();
        when(ossProperties.getMaxUploadBytes()).thenReturn(200L * 1024 * 1024);
        when(ossProperties.getImageMaxBytes()).thenReturn(20L * 1024 * 1024);
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}) {
            @Override
            public long getSize() {
                return 21L * 1024 * 1024;
            }

            @Override
            public boolean isEmpty() {
                return false;
            }
        };
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.upload("cover", file));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("图片"));
    }

    @Test
    void uploadCapabilities_reportsProxyVideoLimitWhenDirectOff() {
        enableOss();
        when(ossProperties.isDirectUploadEnabled()).thenReturn(false);
        when(ossProperties.getMaxUploadBytes()).thenReturn(200L * 1024 * 1024);
        when(ossProperties.getImageMaxBytes()).thenReturn(20L * 1024 * 1024);
        when(ossProperties.getSubtitleMaxBytes()).thenReturn(10L * 1024 * 1024);

        Map<String, Object> caps = ossService.uploadCapabilities();
        assertEquals(false, caps.get("directUploadEnabled"));
        assertEquals(200L * 1024 * 1024, caps.get("videoMaxBytes"));
        assertEquals(200L * 1024 * 1024, caps.get("proxyMaxBytes"));
    }

    @Test
    void createDirectPolicy_rejectsOverTwoGigabytes() {
        enableOssDirect();
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.createDirectPolicy("video", "a.mp4", 2L * 1024 * 1024 * 1024 + 1));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("2GB"));
    }

    @Test
    void createDirectPolicy_disabled_returnsStableErrorKey() {
        enableOss();
        when(ossProperties.isDirectUploadEnabled()).thenReturn(false);
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.createDirectPolicy("video", "a.mp4", 1024));
        assertEquals(503, ex.getCode());
        assertEquals(OssService.DIRECT_UPLOAD_DISABLED, ex.getErrorKey());
    }

    @Test
    void createDirectPolicy_rejectsNonVideo() {
        enableOssDirect();
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.createDirectPolicy("document", "a.pdf", 1024));
        assertEquals(400, ex.getCode());
    }

    @Test
    void createDirectPolicy_signsExactVideoObject() {
        enableOssDirect();
        Map<String, String> policy = ossService.createDirectPolicy(
                "video", "lesson.mp4", 250L * 1024 * 1024);
        assertTrue(policy.get("key").startsWith("videos/"));
        assertTrue(policy.get("key").endsWith(".mp4"));
        assertEquals("ak", policy.get("accessKeyId"));
        assertEquals("204", policy.get("successActionStatus"));
        assertTrue(policy.get("host").startsWith("https://bucket.oss-cn-chengdu.aliyuncs.com"));
        assertEquals(OssPostPolicy.hmacSha1Base64("sk", policy.get("policy")), policy.get("signature"));
    }

    @Test
    void completeDirectUpload_deletesWhenSizeMismatches() {
        enableOssDirect();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        doReturn(true).when(service).deleteObjectQuietly(anyString());
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(10);
        String key = "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4";
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.completeDirectUpload("video", key, 20));
        assertEquals(400, ex.getCode());
        verify(service).deleteObjectQuietly(key);
    }

    @Test
    void completeDirectUpload_deletesWhenMagicMismatches() {
        enableOssDirect();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        doReturn(true).when(service).deleteObjectQuietly(anyString());
        String key = "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4";
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(12);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        stubRangeReads(client, "<html>nope".getBytes());

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.completeDirectUpload("video", key, 12));
        assertEquals(400, ex.getCode());
        verify(service).deleteObjectQuietly(key);
    }

    @Test
    void completeDirectUpload_returnsPersistUrlWhenValid() {
        enableOssDirect();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        String key = "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4";
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(12);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        byte[] mp4Header = new byte[12];
        mp4Header[4] = 'f';
        mp4Header[5] = 't';
        mp4Header[6] = 'y';
        mp4Header[7] = 'p';
        stubRangeReads(client, mp4Header);

        Map<String, String> result = service.completeDirectUpload("video", key, 12);

        assertEquals(key, result.get("objectKey"));
        assertEquals("https://cdn.yunmanvr.com/" + key, result.get("url"));
        verify(service, never()).deleteObjectQuietly(anyString());

        Map<String, String> again = service.completeDirectUpload("video", key, 12);
        assertEquals(result.get("url"), again.get("url"));
        verify(service, never()).deleteObjectQuietly(anyString());
    }

    @Test
    void completeDirectUpload_rejectsHevcAndDeletes() {
        enableOssDirect();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        doReturn(true).when(service).deleteObjectQuietly(anyString());
        String key = "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4";
        byte[] hevc = Mp4TestFixtures.ftypHevc();
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(hevc.length);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        stubRangeReads(client, hevc);

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.completeDirectUpload("video", key, hevc.length));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("H.265"));
        verify(service).deleteObjectQuietly(key);
    }

    @Test
    void completeDirectUpload_rejectsBuriedHevcAndDeletes() {
        enableOssDirect();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        doReturn(true).when(service).deleteObjectQuietly(anyString());
        String key = "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4";
        byte[] hevc = Mp4TestFixtures.buriedHevcAfterLargeMdat();
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(hevc.length);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        stubRangeReads(client, hevc);

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.completeDirectUpload("video", key, hevc.length));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("H.265"));
        verify(service).deleteObjectQuietly(key);
    }

    @Test
    void upload_rejectsHevcVideoAndDoesNotPutObject() {
        enableOss();
        when(ossProperties.getMaxUploadBytes()).thenReturn(200L * 1024 * 1024);
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.upload("video",
                        new MockMultipartFile("file", "iphone.mov", "video/quicktime",
                                Mp4TestFixtures.buriedHevcAfterLargeMdat())));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("H.265"));
        verify(client, never()).putObject(anyString(), anyString(), any(InputStream.class), any(ObjectMetadata.class));
    }

    @Test
    void upload_returnsFastStartWarningForProxyVideo() {
        enableOss();
        when(ossProperties.getMaxUploadBytes()).thenReturn(200L * 1024 * 1024);
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();
        byte[] file = Mp4TestFixtures.concat(
                Mp4TestFixtures.ftypIsom(),
                Mp4TestFixtures.isoBox("mdat", new byte[16]),
                Mp4TestFixtures.videoMoov("avc1"));

        Map<String, String> result = service.upload("video",
                new MockMultipartFile("file", "lecture.mp4", "video/mp4", file));
        assertTrue(result.get("compatWarning").contains("Fast Start"));
        verify(client).putObject(eq("bucket"), anyString(), any(InputStream.class), any(ObjectMetadata.class));
    }

    @Test
    void upload_acceptsResourceFileAac() {
        enableOss();
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();
        byte[] adts = new byte[]{(byte) 0xFF, (byte) 0xF1, 0x50, (byte) 0x80};
        Map<String, String> result = service.upload("resource_file",
                new MockMultipartFile("file", "guide.aac", "audio/aac", adts));
        assertTrue(result.get("objectKey").startsWith("audios/"));
        assertTrue(result.get("objectKey").endsWith(".aac"));
    }

    // ---------- 上传对象元信息（后台预览框显示真实文件名） ----------

    @Test
    void upload_recordsOriginalFileName() throws Exception {
        enableOss();
        OssService service = spy(ossService);
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();
        byte[] pdf = new byte[]{'%', 'P', 'D', 'F'};
        Map<String, String> result = service.upload("document",
                new MockMultipartFile("file", "2026春季选课指南.pdf", "application/pdf", pdf));

        ArgumentCaptor<OssObjectMeta> captor = ArgumentCaptor.forClass(OssObjectMeta.class);
        verify(ossObjectMetaMapper).insert(captor.capture());
        OssObjectMeta saved = captor.getValue();
        assertEquals(result.get("objectKey"), saved.getObjectKey());
        assertEquals("2026春季选课指南.pdf", saved.getOriginalName());
        assertEquals(pdf.length, saved.getSizeBytes());
        assertEquals("document", saved.getScene());
    }

    /** 老库还没跑 patch-oss-object-meta.sql 时表不存在；记元信息失败绝不能把上传带崩 */
    @Test
    void upload_survivesMetaInsertFailure() throws Exception {
        enableOss();
        when(ossObjectMetaMapper.insert(any(OssObjectMeta.class))).thenThrow(new RuntimeException("Table doesn't exist"));
        OssService service = spy(ossService);
        OSS client = mock(OSS.class);
        doReturn(client).when(service).buildTransferClient();
        Map<String, String> result = service.upload("document",
                new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'}));
        assertTrue(result.get("url").endsWith(result.get("objectKey")));
    }

    /** 有的浏览器把整条本地路径当文件名传上来，只留最后一段 */
    @Test
    void recordObjectMeta_stripsClientPath() {
        ossService.recordObjectMeta("document", "files/202609/abc.pdf", "C:\\Users\\老师\\讲义.pdf", 10);
        ArgumentCaptor<OssObjectMeta> captor = ArgumentCaptor.forClass(OssObjectMeta.class);
        verify(ossObjectMetaMapper).insert(captor.capture());
        assertEquals("讲义.pdf", captor.getValue().getOriginalName());
    }

    @Test
    void objectMeta_returnsEmptyWhenUnknown() {
        enableOss();
        when(ossObjectMetaMapper.selectOne(any())).thenReturn(null);
        assertTrue(ossService.objectMeta("https://cdn.yunmanvr.com/files/202609/abc.pdf").isEmpty());
        // 地址为空 / 解析不出对象名时同样返回空，不抛异常
        assertTrue(ossService.objectMeta("").isEmpty());
    }

    @Test
    void objectMeta_returnsStoredName() {
        enableOss();
        OssObjectMeta row = new OssObjectMeta();
        row.setObjectKey("files/202609/abc.pdf");
        row.setOriginalName("选课指南.pdf");
        row.setSizeBytes(2_516_582L);
        row.setCreateTime(java.time.LocalDateTime.of(2026, 9, 1, 14, 20));
        when(ossObjectMetaMapper.selectOne(any())).thenReturn(row);

        Map<String, Object> meta = ossService.objectMeta("https://cdn.yunmanvr.com/files/202609/abc.pdf");
        assertEquals("选课指南.pdf", meta.get("originalName"));
        assertEquals(2_516_582L, meta.get("sizeBytes"));
        assertEquals("files/202609/abc.pdf", meta.get("objectKey"));
        assertEquals("2026-09-01T14:20", meta.get("uploadedAt"));
    }

    /** 查询失败（老库无表）退化成「没有元信息」，不能把后台表单打开这件事弄挂 */
    @Test
    void objectMeta_survivesQueryFailure() {
        enableOss();
        when(ossObjectMetaMapper.selectOne(any())).thenThrow(new RuntimeException("Table doesn't exist"));
        assertTrue(ossService.objectMeta("https://cdn.yunmanvr.com/files/202609/abc.pdf").isEmpty());
    }

    // ---------- 字幕预览：白名单与截断口径 ----------

    /**
     * 只放行 .vtt/.srt 是这个接口的安全边界，不是挑食：
     * 放开任意后缀，它就成了一个「按 URL 读任意受管对象正文」的接口。
     */
    @Test
    void subtitlePreview_rejectsNonSubtitleExtensions() {
        enableOss();
        for (String url : new String[]{
                "https://cdn.yunmanvr.com/files/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.pdf",
                "https://cdn.yunmanvr.com/videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4",
                "https://cdn.yunmanvr.com/audios/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp3"
        }) {
            var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                    () -> ossService.subtitlePreview(url));
            assertEquals(400, ex.getCode(), url);
            assertTrue(ex.getMessage().contains("VTT"), url);
        }
    }

    /** 非受管前缀的对象一律拒绝，别让这个接口变成任意路径读取 */
    @Test
    void subtitlePreview_rejectsUnmanagedKey() {
        enableOss();
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.subtitlePreview("https://cdn.yunmanvr.com/../../etc/passwd.vtt"));
        assertEquals(400, ex.getCode());
    }

    @Test
    void subtitlePreview_rejectsBlankUrl() {
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.subtitlePreview("  "));
        assertEquals(400, ex.getCode());
    }

    /** 未配置 OSS 时给 503 而不是 500，前端才能把「没配」和「读失败」分开提示 */
    @Test
    void subtitlePreview_returns503WhenOssDisabled() {
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.subtitlePreview("https://cdn.yunmanvr.com/subtitles/202609/a.vtt"));
        assertEquals(503, ex.getCode());
    }

    @Test
    void subtitlePreview_readsWholeSmallFile() {
        enableOss();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        String key = "subtitles/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.vtt";
        String vtt = "WEBVTT\n\n00:00:01.200 --> 00:00:04.600\n各位同学好。\n";
        byte[] body = vtt.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(body.length);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        OSSObject object = mock(OSSObject.class);
        when(object.getObjectContent()).thenReturn(new ByteArrayInputStream(body));
        when(client.getObject(any(GetObjectRequest.class))).thenReturn(object);

        Map<String, Object> res = service.subtitlePreview("https://cdn.yunmanvr.com/" + key);
        assertEquals(vtt, res.get("text"), "中文字幕必须按 UTF-8 还原，不能变成乱码");
        assertEquals(false, res.get("truncated"));
    }

    /** 超过读取上限时必须如实标 truncated，否则前端会把「已读到的条数」当成总条数报给老师 */
    @Test
    void subtitlePreview_flagsTruncationBeyondCap() {
        enableOss();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        String key = "subtitles/202609/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.srt";
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(OssService.SUBTITLE_PREVIEW_MAX_BYTES + 1L);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);
        OSSObject object = mock(OSSObject.class);
        when(object.getObjectContent())
                .thenReturn(new ByteArrayInputStream(new byte[OssService.SUBTITLE_PREVIEW_MAX_BYTES]));
        when(client.getObject(any(GetObjectRequest.class))).thenReturn(object);

        Map<String, Object> res = service.subtitlePreview("https://cdn.yunmanvr.com/" + key);
        assertEquals(true, res.get("truncated"));
    }

    /** ASR 产了个 0 字节文件：不能抛异常，要如实返回空正文让前端提示「没有任何时间轴」 */
    @Test
    void subtitlePreview_returnsEmptyForZeroLengthObject() {
        enableOss();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        String key = "subtitles/202609/cccccccccccccccccccccccccccccccc.vtt";
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentLength(0);
        when(client.getObjectMetadata("bucket", key)).thenReturn(meta);

        Map<String, Object> res = service.subtitlePreview("https://cdn.yunmanvr.com/" + key);
        assertEquals("", res.get("text"));
        assertEquals(false, res.get("truncated"));
    }

    /** 云端读失败给 500，且不能把 OSS 的原始异常信息透给前端 */
    @Test
    void subtitlePreview_wrapsRemoteFailure() {
        enableOss();
        OssService service = spy(new OssService(ossProperties, ossObjectMetaMapper));
        OSS client = mock(OSS.class);
        doReturn(client).when(service).getRangeTransferClient();
        String key = "subtitles/202609/dddddddddddddddddddddddddddddddd.vtt";
        when(client.getObjectMetadata("bucket", key)).thenThrow(new RuntimeException("NoSuchKey"));

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> service.subtitlePreview("https://cdn.yunmanvr.com/" + key));
        assertEquals(500, ex.getCode());
        assertEquals("读取字幕失败", ex.getMessage());
    }

    private static void stubRangeReads(OSS client, byte[] body) {
        when(client.getObject(any(GetObjectRequest.class))).thenAnswer(inv -> {
            GetObjectRequest req = inv.getArgument(0);
            long[] range = req.getRange();
            int start = 0;
            int end = body.length - 1;
            if (range != null && range.length >= 2) {
                start = (int) Math.max(0, range[0]);
                end = range[1] < 0 ? body.length - 1 : (int) Math.min(body.length - 1, range[1]);
            }
            byte[] slice = (start <= end && start < body.length)
                    ? Arrays.copyOfRange(body, start, end + 1)
                    : new byte[0];
            OSSObject object = mock(OSSObject.class);
            when(object.getObjectContent()).thenReturn(new ByteArrayInputStream(slice));
            return object;
        });
    }

    private void enableOss() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");
    }

    private void enableOssDirect() {
        enableOss();
        when(ossProperties.isDirectUploadEnabled()).thenReturn(true);
        when(ossProperties.getDirectVideoMaxBytes()).thenReturn(2L * 1024 * 1024 * 1024);
        when(ossProperties.getDirectPolicyExpireSeconds()).thenReturn(900);
        when(ossProperties.getMaxUploadBytes()).thenReturn(200L * 1024 * 1024);
    }
}
