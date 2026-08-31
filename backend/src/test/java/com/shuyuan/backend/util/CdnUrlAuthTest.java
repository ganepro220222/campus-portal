package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CdnUrlAuthTest {

    @Test
    void typeA_matchesAliyunHelpCenterVector() {
        // https://help.aliyun.com/zh/cdn/user-guide/type-a-signing
        assertEquals(
                "23bf85053008f5c0e791667a313e28ce",
                CdnUrlAuth.md5Hex("/video/standard/test.mp4-1444435200-0-0-aliyuncdnexp1234"));
        assertEquals(
                "https://cdn.example.com/video/standard/test.mp4?auth_key=1444435200-0-0-23bf85053008f5c0e791667a313e28ce",
                CdnUrlAuth.signTypeA(
                        "https://cdn.example.com/",
                        "video/standard/test.mp4",
                        "aliyuncdnexp1234",
                        1444435200L,
                        "0",
                        "0"));
    }

    @Test
    void typeA_neverEmitsBarePath() {
        String url = CdnUrlAuth.signTypeA(
                "https://cdn.yunmanvr.com",
                "videos/202608/abc.mp4",
                "testkey",
                1_800_000_000L);
        assertTrue(url.startsWith("https://cdn.yunmanvr.com/videos/202608/abc.mp4?auth_key="));
        assertTrue(url.contains("1800000000-"));
        assertFalse(url.contains("Signature"));
        assertEquals("/videos/202608/abc.mp4", CdnUrlAuth.toUri("videos/202608/abc.mp4"));
    }

    @Test
    void typeA_rejectsDashInRand() {
        assertThrows(IllegalArgumentException.class, () ->
                CdnUrlAuth.signTypeA("https://cdn.example.com", "a.mp4", "k", 1L, "a-b", "0"));
    }
}
