package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OssEndpointSupportTest {

    @Test
    void publicEndpoint_stripsInternalAndKeepsPublic() {
        assertEquals(
                "https://oss-cn-chengdu.aliyuncs.com",
                OssEndpointSupport.publicEndpoint("https://oss-cn-chengdu.aliyuncs.com"));
        assertEquals(
                "https://oss-cn-chengdu.aliyuncs.com",
                OssEndpointSupport.publicEndpoint("https://oss-cn-chengdu-internal.aliyuncs.com"));
        assertEquals("", OssEndpointSupport.publicEndpoint(""));
        assertEquals("", OssEndpointSupport.publicEndpoint(null));
    }

    @Test
    void transferEndpoint_usesOverrideOnlyWhenSet() {
        assertEquals(
                "https://oss-cn-chengdu.aliyuncs.com",
                OssEndpointSupport.transferEndpoint("https://oss-cn-chengdu.aliyuncs.com", ""));
        assertEquals(
                "https://oss-cn-chengdu-internal.aliyuncs.com",
                OssEndpointSupport.transferEndpoint(
                        "https://oss-cn-chengdu.aliyuncs.com",
                        "https://oss-cn-chengdu-internal.aliyuncs.com"));
        assertEquals(
                "https://oss-cn-chengdu.aliyuncs.com",
                OssEndpointSupport.transferEndpoint("https://oss-cn-chengdu.aliyuncs.com", null));
    }

    @Test
    void publicBucketBase_neverEmitsInternalHost() {
        assertEquals(
                "https://yunman-shuyuan.oss-cn-chengdu.aliyuncs.com",
                OssEndpointSupport.publicBucketBase(
                        "yunman-shuyuan", "https://oss-cn-chengdu-internal.aliyuncs.com"));
    }
}
