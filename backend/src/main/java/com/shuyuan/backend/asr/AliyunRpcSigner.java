package com.shuyuan.backend.asr;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 阿里云 RPC 风格 OpenAPI 签名（nls-filetrans）。
 * SubmitTask 必须 POST；GetTaskResult 必须 GET，否则网关返回 UnsupportedHTTPMethod。
 */
final class AliyunRpcSigner {

    private AliyunRpcSigner() {}

    static SignedRequest signPost(String host, String accessKeyId, String accessKeySecret,
                                  String action, String version, Map<String, String> extra) {
        return sign("POST", host, accessKeyId, accessKeySecret, action, version, extra, null, null);
    }

    static SignedRequest signGet(String host, String accessKeyId, String accessKeySecret,
                                 String action, String version, Map<String, String> extra) {
        return sign("GET", host, accessKeyId, accessKeySecret, action, version, extra, null, null);
    }

    /** 单测可固定 nonce / timestamp，避免随机签名无法断言。 */
    static SignedRequest sign(String method, String host, String accessKeyId, String accessKeySecret,
                              String action, String version, Map<String, String> extra,
                              String nonce, String timestamp) {
        TreeMap<String, String> params = new TreeMap<>();
        params.put("AccessKeyId", accessKeyId);
        params.put("Action", action);
        params.put("Format", "JSON");
        params.put("RegionId", extra.getOrDefault("RegionId", "cn-shanghai"));
        params.put("SignatureMethod", "HMAC-SHA1");
        params.put("SignatureNonce", nonceOrRandom(nonce));
        params.put("SignatureVersion", "1.0");
        params.put("Timestamp", timestampOrNow(timestamp));
        params.put("Version", version);
        extra.forEach((k, v) -> {
            if (!"RegionId".equals(k) && v != null && !v.isBlank()) {
                params.put(k, v);
            }
        });

        String canonicalized = params.entrySet().stream()
                .map(e -> percentEncode(e.getKey()) + "=" + percentEncode(e.getValue()))
                .collect(Collectors.joining("&"));
        String stringToSign = method + "&" + percentEncode("/") + "&" + percentEncode(canonicalized);
        String signature = hmacSha1(accessKeySecret + "&", stringToSign);
        params.put("Signature", signature);

        String encoded = params.entrySet().stream()
                .map(e -> percentEncode(e.getKey()) + "=" + percentEncode(e.getValue()))
                .collect(Collectors.joining("&"));

        if ("GET".equals(method)) {
            return new SignedRequest("GET", "https://" + host + "/?" + encoded, "");
        }
        return new SignedRequest("POST", "https://" + host + "/", encoded);
    }

    private static String nonceOrRandom(String nonce) {
        return nonce != null && !nonce.isBlank() ? nonce : UUID.randomUUID().toString();
    }

    private static String timestampOrNow(String timestamp) {
        if (timestamp != null && !timestamp.isBlank()) {
            return timestamp;
        }
        return ZonedDateTime.now(ZoneOffset.UTC)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }

    private static String hmacSha1(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("签名失败", e);
        }
    }

    static String percentEncode(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8)
                    .replace("+", "%20")
                    .replace("*", "%2A")
                    .replace("%7E", "~");
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    record SignedRequest(String method, String url, String body) {}
}
