package com.shuyuan.backend.service;

import com.shuyuan.backend.config.OssProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
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
    void upload_acceptsGlbScene_whenEnabled_withoutCallingCloud() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");
        when(ossProperties.getMaxUploadBytes()).thenReturn(1024L * 1024);

        MockMultipartFile file = new MockMultipartFile("file", "craft.glb", "model/gltf-binary", "glTF".getBytes());
        // 未 mock OSS 客户端，会在实际上传时失败；此处仅验证场景白名单不拦截 glb
        try {
            ossService.upload("model3d", file);
        } catch (com.shuyuan.backend.common.exception.BusinessException ex) {
            assertNotEquals(400, ex.getCode(), "glb 扩展名应通过白名单校验");
        }
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
    void uploadModel3dGlb_rejects_whenDisabled() {
        byte[] glb = new byte[]{1, 2, 3};
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.uploadModel3dGlb(1L, glb));
        assertEquals(503, ex.getCode());
    }

    @Test
    void uploadModel3dGlb_rejects_emptyBytes_whenEnabled() {
        when(ossProperties.isEnabled()).thenReturn(true);
        when(ossProperties.getEndpoint()).thenReturn("https://oss-cn-test.aliyuncs.com");
        when(ossProperties.getBucket()).thenReturn("bucket");
        when(ossProperties.getAccessKey()).thenReturn("ak");
        when(ossProperties.getSecretKey()).thenReturn("sk");

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> ossService.uploadModel3dGlb(1L, new byte[0]));
        assertEquals(400, ex.getCode());
    }
}
