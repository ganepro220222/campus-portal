package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CourseVideoUrlPolicyTest {

    private OssProperties props;

    @BeforeEach
    void setUp() {
        props = new OssProperties();
        props.setEnabled(true);
        props.setBucket("my-bucket");
        props.setEndpoint("https://oss-cn-shanghai.aliyuncs.com");
        props.setCdnDomain("https://cdn.example.com");
    }

    @Test
    void acceptsTrustedObjectKey() {
        String key = CourseVideoUrlPolicy.resolveTrustedVideoObjectKey("videos/demo.mp4", props, true);
        assertEquals("videos/demo.mp4", key);
    }

    @Test
    void acceptsTrustedCdnUrl() {
        String key = CourseVideoUrlPolicy.resolveTrustedVideoObjectKey(
                "https://cdn.example.com/videos/lecture.mp4", props, true);
        assertEquals("videos/lecture.mp4", key);
    }

    @Test
    void rejectsExternalHostUrl() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoUrlPolicy.resolveTrustedVideoObjectKey(
                        "https://evil.example.com/videos/a.mp4", props, true));
        assertEquals(400, ex.getCode());
    }

    @Test
    void rejectsNonVideosPrefix() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoUrlPolicy.resolveTrustedVideoObjectKey("covers/a.mp4", props, true));
        assertEquals(400, ex.getCode());
    }

    @Test
    void rejectsPathTraversal() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoUrlPolicy.resolveTrustedVideoObjectKey("videos/../secret.mp4", props, true));
        assertEquals(400, ex.getCode());
    }

    @Test
    void rejectsNonVideoExtension() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoUrlPolicy.resolveTrustedVideoObjectKey("videos/readme.txt", props, true));
        assertEquals(400, ex.getCode());
    }

    @Test
    void rejectsWhenOssDisabled() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> CourseVideoUrlPolicy.resolveTrustedVideoObjectKey("videos/demo.mp4", props, false));
        assertEquals(503, ex.getCode());
    }
}
