package com.shuyuan.backend.util;

import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * 阿里云 OSS PostObject 策略（HMAC-SHA1）。服务器用长期密钥签名，浏览器只拿到单次 key 与大小约束。
 */
public final class OssPostPolicy {

    public static final String SUCCESS_ACTION_STATUS = "204";

    private OssPostPolicy() {
    }

    public record SignedPost(
            String host,
            String bucket,
            String key,
            String policy,
            String accessKeyId,
            String signature,
            String successActionStatus,
            Instant expireAt
    ) {
        public Map<String, String> toClientMap() {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("host", host);
            m.put("bucket", bucket);
            m.put("key", key);
            m.put("policy", policy);
            m.put("accessKeyId", accessKeyId);
            m.put("signature", signature);
            m.put("successActionStatus", successActionStatus);
            m.put("expireAt", expireAt.toString());
            return m;
        }
    }

    public static SignedPost sign(
            String publicBucketHost,
            String bucket,
            String accessKeyId,
            String accessKeySecret,
            String objectKey,
            long contentLength,
            Instant expireAt) {
        if (!StringUtils.hasText(publicBucketHost) || !StringUtils.hasText(bucket)
                || !StringUtils.hasText(accessKeyId) || !StringUtils.hasText(accessKeySecret)
                || !StringUtils.hasText(objectKey)) {
            throw new IllegalArgumentException("OSS PostObject 缺少主机、Bucket、密钥或对象名");
        }
        if (contentLength <= 0) {
            throw new IllegalArgumentException("OSS PostObject 文件大小无效");
        }
        Instant exp = expireAt != null ? expireAt : Instant.now().plusSeconds(900);
        String policyJson = policyJson(bucket, objectKey, contentLength, exp);
        String policy = Base64.getEncoder().encodeToString(policyJson.getBytes(StandardCharsets.UTF_8));
        String signature = hmacSha1Base64(accessKeySecret, policy);
        String host = publicBucketHost.endsWith("/")
                ? publicBucketHost.substring(0, publicBucketHost.length() - 1)
                : publicBucketHost;
        return new SignedPost(
                host,
                bucket,
                objectKey,
                policy,
                accessKeyId,
                signature,
                SUCCESS_ACTION_STATUS,
                exp);
    }

    static String policyJson(String bucket, String objectKey, long contentLength, Instant expireAt) {
        String expiration = DateTimeFormatter.ISO_INSTANT.format(expireAt);
        return "{\"expiration\":\"" + expiration + "\",\"conditions\":["
                + "{\"bucket\":\"" + jsonEscape(bucket) + "\"},"
                + "{\"key\":\"" + jsonEscape(objectKey) + "\"},"
                + "[\"content-length-range\"," + contentLength + "," + contentLength + "],"
                + "[\"eq\",\"$success_action_status\",\"" + SUCCESS_ACTION_STATUS + "\"]"
                + "]}";
    }

    public static String hmacSha1Base64(String secret, String policyBase64) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(policyBase64.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("无法计算 OSS PostObject 签名", e);
        }
    }

    private static String jsonEscape(String value) {
        return Objects.requireNonNull(value)
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
