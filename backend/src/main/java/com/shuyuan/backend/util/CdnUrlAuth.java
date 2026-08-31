package com.shuyuan.backend.util;

import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.UUID;

/**
 * 阿里云 CDN URL 鉴权（方式 A）。
 * {@code auth_key=timestamp-rand-uid-md5(URI-timestamp-rand-uid-key)}
 * <p>
 * 这里的 timestamp 按<strong>过期时刻</strong>写入。控制台「鉴权 URL 有效时长」
 * 填当前界面允许的最小值 1 秒，实际寿命只会多这一秒。
 */
public final class CdnUrlAuth {

    private CdnUrlAuth() {
    }

    public static String signTypeA(String cdnBase, String objectKey, String privateKey, long expireEpochSeconds) {
        return signTypeA(cdnBase, objectKey, privateKey, expireEpochSeconds, newRand(), "0");
    }

    public static String signTypeA(
            String cdnBase,
            String objectKey,
            String privateKey,
            long expireEpochSeconds,
            String rand,
            String uid) {
        if (!StringUtils.hasText(cdnBase) || !StringUtils.hasText(objectKey) || !StringUtils.hasText(privateKey)) {
            throw new IllegalArgumentException("CDN 鉴权缺少域名、对象或密钥");
        }
        String uri = toUri(objectKey);
        String r = StringUtils.hasText(rand) ? rand : "0";
        String u = StringUtils.hasText(uid) ? uid : "0";
        if (r.contains("-") || u.contains("-")) {
            throw new IllegalArgumentException("CDN 鉴权 rand/uid 不能包含中划线");
        }
        String ts = Long.toString(expireEpochSeconds);
        String hash = md5Hex(uri + "-" + ts + "-" + r + "-" + u + "-" + privateKey);
        return trimSlash(cdnBase) + uri + "?auth_key=" + ts + "-" + r + "-" + u + "-" + hash;
    }

    public static String toUri(String objectKey) {
        String key = objectKey.trim();
        if (key.startsWith("/")) {
            return key;
        }
        return "/" + key;
    }

    public static String newRand() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    static String md5Hex(String s) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format(Locale.ROOT, "%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 unavailable", e);
        }
    }

    private static String trimSlash(String url) {
        String s = url.trim();
        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }
}
