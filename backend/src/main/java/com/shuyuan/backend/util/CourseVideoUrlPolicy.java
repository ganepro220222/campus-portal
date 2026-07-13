package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/**
 * 课程视频 URL 可信校验（ASR FileLink 等安全敏感场景）。
 */
public final class CourseVideoUrlPolicy {

    private static final String VIDEO_PREFIX = "videos/";
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "mov");

    private CourseVideoUrlPolicy() {}

    /**
     * 解析并校验为可信 OSS 视频 objectKey。
     * @throws BusinessException 400/503
     */
    public static String resolveTrustedVideoObjectKey(String stored, OssProperties ossProperties, boolean ossEnabled) {
        if (!StringUtils.hasText(stored)) {
            throw new BusinessException(400, "视频地址不能为空");
        }
        if (!ossEnabled) {
            throw new BusinessException(503, "ASR 字幕生成要求 OSS 已启用，且视频须为本项目 videos/ 目录");
        }
        String trimmed = stored.trim();
        String objectKey;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            objectKey = resolveFromHttpUrl(trimmed, ossProperties);
        } else {
            objectKey = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
        }
        validateObjectKey(objectKey);
        return objectKey;
    }

    private static String resolveFromHttpUrl(String url, OssProperties ossProperties) {
        URI uri;
        try {
            uri = URI.create(url);
        } catch (Exception e) {
            throw new BusinessException(400, "视频地址格式无效");
        }
        String host = uri.getHost();
        if (!StringUtils.hasText(host) || !isTrustedHost(host.toLowerCase(Locale.ROOT), ossProperties)) {
            throw new BusinessException(400, "视频地址域名不在允许范围内");
        }
        String path = uri.getPath();
        if (!StringUtils.hasText(path) || "/".equals(path)) {
            throw new BusinessException(400, "视频地址路径无效");
        }
        return path.startsWith("/") ? path.substring(1) : path;
    }

    static boolean isTrustedHost(String host, OssProperties props) {
        if (StringUtils.hasText(props.getCdnDomain())) {
            try {
                String cdnHost = URI.create(trimTrailingSlash(props.getCdnDomain())).getHost();
                if (cdnHost != null && cdnHost.equalsIgnoreCase(host)) {
                    return true;
                }
            } catch (Exception ignored) {
                // fall through
            }
        }
        String endpoint = props.getEndpoint();
        String bucket = props.getBucket();
        if (StringUtils.hasText(endpoint) && StringUtils.hasText(bucket)) {
            String ep = endpoint.replace("https://", "").replace("http://", "");
            String bucketHost = (bucket + "." + ep).toLowerCase(Locale.ROOT);
            if (bucketHost.equals(host)) {
                return true;
            }
        }
        return false;
    }

    static void validateObjectKey(String objectKey) {
        if (!StringUtils.hasText(objectKey)) {
            throw new BusinessException(400, "视频 objectKey 无效");
        }
        if (objectKey.contains("..") || objectKey.contains("\\")) {
            throw new BusinessException(400, "视频路径不合法");
        }
        if (!objectKey.startsWith(VIDEO_PREFIX)) {
            throw new BusinessException(400, "视频须位于 videos/ 目录");
        }
        String ext = extractExtension(objectKey);
        if (!VIDEO_EXTENSIONS.contains(ext)) {
            throw new BusinessException(400, "仅支持 mp4/mov 视频格式");
        }
    }

    private static String extractExtension(String key) {
        int dot = key.lastIndexOf('.');
        if (dot < 0 || dot == key.length() - 1) {
            return "";
        }
        return key.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String trimTrailingSlash(String url) {
        String s = url.trim();
        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }
}
