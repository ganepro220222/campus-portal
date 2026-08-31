package com.shuyuan.backend.util;

import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 拆分 OSS 外网 / 内网 Endpoint：数据面（上传、删除、读对象）可用 VPC 内网，
 * 签名和对外拼接地址必须始终走外网，避免 ASR / 浏览器拿到 *-internal 主机名。
 */
public final class OssEndpointSupport {

    private OssEndpointSupport() {
    }

    /** 签名、对外 URL 用的外网 Endpoint。误写成内网时自动剥掉 {@code -internal}。 */
    public static String publicEndpoint(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return "";
        }
        return endpoint.trim().replace("-internal.aliyuncs.com", ".aliyuncs.com");
    }

    /**
     * 数据面 Endpoint。仅当显式配置了内网地址才改走内网；
     * 本机 Windows 不配 {@code OSS_INTERNAL_ENDPOINT}，避免连不上 VPC。
     */
    public static String transferEndpoint(String endpoint, String internalEndpoint) {
        if (StringUtils.hasText(internalEndpoint)) {
            return internalEndpoint.trim();
        }
        return endpoint == null ? "" : endpoint.trim();
    }

    /** 无 CDN 时的 Bucket 外网主机，不会拼出 internal。 */
    public static String publicBucketBase(String bucket, String endpoint) {
        if (!StringUtils.hasText(bucket) || !StringUtils.hasText(endpoint)) {
            return "";
        }
        String host = publicEndpoint(endpoint).replaceFirst("^https?://", "");
        return "https://" + bucket + "." + host;
    }

    private static final Pattern INTERNAL_HOST =
            Pattern.compile("^oss-([a-z0-9-]+)-internal\\.aliyuncs\\.com$");
    private static final Pattern PUBLIC_HOST =
            Pattern.compile("^oss-([a-z0-9-]+)\\.aliyuncs\\.com$");

    /** {@code oss-cn-chengdu.aliyuncs.com} / {@code oss-cn-chengdu-internal} → {@code cn-chengdu}。 */
    public static String regionId(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return "";
        }
        String host = endpoint.trim().toLowerCase(java.util.Locale.ROOT)
                .replaceFirst("^https?://", "")
                .split("/")[0];
        Matcher internal = INTERNAL_HOST.matcher(host);
        if (internal.matches()) {
            return internal.group(1);
        }
        Matcher pub = PUBLIC_HOST.matcher(host);
        return pub.matches() ? pub.group(1) : "";
    }

    /**
     * 内网未配则跳过；两边都能解析出地域时必须一致。
     * 贵州公网配成都内网会让上传/读对象打到错误地域。
     */
    public static void assertSameRegion(String endpoint, String internalEndpoint) {
        if (!StringUtils.hasText(internalEndpoint)) {
            return;
        }
        String pub = regionId(publicEndpoint(endpoint));
        String inner = regionId(internalEndpoint);
        if (pub.isEmpty() || inner.isEmpty()) {
            return;
        }
        if (!pub.equals(inner)) {
            throw new IllegalStateException(
                    "OSS_ENDPOINT 与 OSS_INTERNAL_ENDPOINT 地域不一致：" + pub + " vs " + inner
                            + "。内网地址必须与 Bucket 所在地域相同。");
        }
    }
}
