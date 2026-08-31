package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void regionId_stripsInternalSuffix() {
        assertEquals("cn-chengdu", OssEndpointSupport.regionId("https://oss-cn-chengdu.aliyuncs.com"));
        assertEquals("cn-chengdu", OssEndpointSupport.regionId("https://oss-cn-chengdu-internal.aliyuncs.com"));
        assertEquals("cn-guizhou", OssEndpointSupport.regionId("oss-cn-guizhou.aliyuncs.com"));
        assertEquals("", OssEndpointSupport.regionId(""));
    }

    @Test
    void assertSameRegion_rejectsMismatchedCopyPaste() {
        OssEndpointSupport.assertSameRegion(
                "https://oss-cn-chengdu.aliyuncs.com",
                "https://oss-cn-chengdu-internal.aliyuncs.com");
        OssEndpointSupport.assertSameRegion("https://oss-cn-chengdu.aliyuncs.com", "");
        var ex = assertThrows(
                IllegalStateException.class,
                () -> OssEndpointSupport.assertSameRegion(
                        "https://oss-cn-guizhou.aliyuncs.com",
                        "https://oss-cn-chengdu-internal.aliyuncs.com"));
        assertTrue(ex.getMessage().contains("cn-guizhou"));
        assertTrue(ex.getMessage().contains("cn-chengdu"));
    }
}
