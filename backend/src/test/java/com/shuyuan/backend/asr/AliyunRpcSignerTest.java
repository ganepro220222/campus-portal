package com.shuyuan.backend.asr;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AliyunRpcSignerTest {

    private static final Map<String, String> EXTRA = Map.of(
            "TaskId", "bc01f9e09020492a976e54068c423c06",
            "RegionId", "cn-shanghai");

    @Test
    void signGet_putsParamsInQueryAndLeavesBodyEmpty() {
        AliyunRpcSigner.SignedRequest signed = AliyunRpcSigner.signGet(
                "filetrans.cn-shanghai.aliyuncs.com",
                "ak-id",
                "ak-secret",
                "GetTaskResult",
                "2018-08-17",
                EXTRA);
        assertEquals("GET", signed.method());
        assertEquals("", signed.body());
        assertTrue(signed.url().startsWith("https://filetrans.cn-shanghai.aliyuncs.com/?"));
        assertTrue(signed.url().contains("Action=GetTaskResult"));
        assertTrue(signed.url().contains("TaskId=bc01f9e09020492a976e54068c423c06"));
        assertTrue(signed.url().contains("Signature="));
    }

    @Test
    void signPost_putsParamsInBody() {
        AliyunRpcSigner.SignedRequest signed = AliyunRpcSigner.signPost(
                "filetrans.cn-shanghai.aliyuncs.com",
                "ak-id",
                "ak-secret",
                "SubmitTask",
                "2018-08-17",
                Map.of("Task", "{\"appkey\":\"k\"}", "RegionId", "cn-shanghai"));
        assertEquals("POST", signed.method());
        assertEquals("https://filetrans.cn-shanghai.aliyuncs.com/", signed.url());
        assertTrue(signed.body().contains("Action=SubmitTask"));
        assertTrue(signed.body().contains("Task="));
    }

    @Test
    void sign_includesHttpMethodInSignature() {
        AliyunRpcSigner.SignedRequest get = AliyunRpcSigner.sign(
                "GET",
                "filetrans.cn-shanghai.aliyuncs.com",
                "ak-id",
                "ak-secret",
                "GetTaskResult",
                "2018-08-17",
                EXTRA,
                "nonce-1",
                "2026-08-30T19:00:00Z");
        AliyunRpcSigner.SignedRequest post = AliyunRpcSigner.sign(
                "POST",
                "filetrans.cn-shanghai.aliyuncs.com",
                "ak-id",
                "ak-secret",
                "GetTaskResult",
                "2018-08-17",
                EXTRA,
                "nonce-1",
                "2026-08-30T19:00:00Z");
        assertNotEquals(signatureOf(get.url()), signatureOf(post.body()));
    }

    private static String signatureOf(String encoded) {
        int i = encoded.indexOf("Signature=");
        return encoded.substring(i + "Signature=".length());
    }
}
