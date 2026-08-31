package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OssPostPolicyTest {

    @Test
    void sign_usesExactKeyAndContentLengthAndHmac() {
        Instant expireAt = Instant.parse("2026-09-01T04:00:00Z");
        OssPostPolicy.SignedPost signed = OssPostPolicy.sign(
                "https://bucket.oss-cn-chengdu.aliyuncs.com",
                "bucket",
                "ak",
                "sk",
                "videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4",
                300L * 1024 * 1024,
                expireAt);

        assertEquals("https://bucket.oss-cn-chengdu.aliyuncs.com", signed.host());
        assertEquals("videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4", signed.key());
        assertEquals("204", signed.successActionStatus());
        String json = new String(Base64.getDecoder().decode(signed.policy()), StandardCharsets.UTF_8);
        assertTrue(json.contains("\"key\":\"videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4\""));
        assertTrue(json.contains("[\"content-length-range\",314572800,314572800]"));
        assertEquals(
                OssPostPolicy.hmacSha1Base64("sk", signed.policy()),
                signed.signature());
        assertEquals(signed.signature(), signed.toClientMap().get("signature"));
    }
}
