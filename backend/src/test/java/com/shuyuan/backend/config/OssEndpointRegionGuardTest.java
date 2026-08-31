package com.shuyuan.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OssEndpointRegionGuardTest {

    @Test
    void skipsWhenOssDisabledEvenIfEndpointsMismatch() {
        OssProperties properties = new OssProperties();
        properties.setEnabled(false);
        properties.setEndpoint("https://oss-cn-guizhou.aliyuncs.com");
        properties.setInternalEndpoint("https://oss-cn-chengdu-internal.aliyuncs.com");
        assertDoesNotThrow(() -> new OssEndpointRegionGuard(properties).run(null));
    }

    @Test
    void stillRejectsMismatchWhenOssEnabled() {
        OssProperties properties = new OssProperties();
        properties.setEnabled(true);
        properties.setEndpoint("https://oss-cn-guizhou.aliyuncs.com");
        properties.setInternalEndpoint("https://oss-cn-chengdu-internal.aliyuncs.com");
        assertThrows(IllegalStateException.class, () -> new OssEndpointRegionGuard(properties).run(null));
    }
}
