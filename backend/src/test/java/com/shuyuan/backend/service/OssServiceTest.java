package com.shuyuan.backend.service;

import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.util.CdnUrlAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * OSS 白名单与未配置场景
 */
@ExtendWith(MockitoExtension.class)
class OssServiceTest {

    @Mock
    private OssProperties ossProperties;

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
    }

    @Test
    void signUrl_usesUnsignedCdn_forPublicAssets_whenCdnAuthOff() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-chengdu.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("yunman-shuyuan");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.yunmanvr.com");
        when(ossProperties.isCdnAuthEnabled()).thenReturn(false);

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

        String cover = ossService.signUrl("images/202608/cover.jpg");
        assertTrue(cover.startsWith("https://cdn.yunmanvr.com/images/202608/cover.jpg?auth_key="), cover);
        String coverAuth = cover.substring(cover.indexOf("auth_key=") + "auth_key=".length());
        long coverExp = Long.parseLong(coverAuth.split("-", 4)[0]);
        assertTrue(coverExp >= now + 7190 && coverExp <= now + 7210, "coverExp=" + coverExp);
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
}
