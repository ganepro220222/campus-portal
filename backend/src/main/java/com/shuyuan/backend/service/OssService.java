package com.shuyuan.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 对象存储：后台上传、签名 URL 下发（私有 Bucket + CDN）
 */
@Service
@RequiredArgsConstructor
public class OssService {

    private static final Map<String, Set<String>> SCENE_EXTENSIONS = buildSceneExtensions();

    private static Map<String, Set<String>> buildSceneExtensions() {
        Map<String, Set<String>> map = new HashMap<>();
        map.put("image", Set.of("jpg", "jpeg", "png", "webp", "gif"));
        map.put("video", Set.of("mp4", "mov"));
        map.put("audio", Set.of("mp3", "m4a", "wav"));
        map.put("document", Set.of("pdf", "doc", "docx", "ppt", "pptx"));
        map.put("resource_file", Set.of("pdf", "doc", "docx", "ppt", "pptx", "mp4", "mp3"));
        map.put("subtitle", Set.of("vtt", "srt"));
        map.put("model3d", Set.of("glb", "gltf"));
        return Map.copyOf(map);
    }

    private final OssProperties ossProperties;

    public boolean isEnabled() {
        return ossProperties.isEnabled()
                && StringUtils.hasText(ossProperties.getEndpoint())
                && StringUtils.hasText(ossProperties.getBucket())
                && StringUtils.hasText(ossProperties.getAccessKey())
                && StringUtils.hasText(ossProperties.getSecretKey());
    }

    /**
     * 将库中存储的地址转为可访问 URL；OSS 未启用时原样返回（便于本地 dev 手填 CDN 地址）
     */
    public String signUrl(String stored) {
        if (!StringUtils.hasText(stored)) {
            return stored;
        }
        if (!isEnabled()) {
            return stored.trim();
        }
        String objectKey = resolveObjectKey(stored.trim());
        if (!StringUtils.hasText(objectKey)) {
            return stored;
        }
        OSS client = null;
        try {
            client = buildClient();
            Date expire = new Date(System.currentTimeMillis() + ossProperties.getSignExpireSeconds() * 1000L);
            String signed = client.generatePresignedUrl(ossProperties.getBucket(), objectKey, expire).toString();
            return rewriteCdnHost(signed);
        } catch (Exception e) {
            throw new BusinessException(500, "生成文件访问地址失败");
        } finally {
            shutdownQuietly(client);
        }
    }

    /** 管理端上传文件到 OSS，返回持久化 URL 与 objectKey */
    public Map<String, String> upload(String scene, MultipartFile file) {
        if (!isEnabled()) {
            throw new BusinessException(503, "对象存储未配置，请设置 OSS 环境变量或手动填写 URL");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "上传文件不能为空");
        }
        if (file.getSize() > ossProperties.getMaxUploadBytes()) {
            throw new BusinessException(400, "文件过大，请使用直传或压缩后重试");
        }
        String ext = extractExtension(file.getOriginalFilename());
        validateExtension(scene, ext);
        String objectKey = buildObjectKey(scene, ext);

        OSS client = null;
        try (InputStream in = file.getInputStream()) {
            client = buildClient();
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(file.getSize());
            if (StringUtils.hasText(file.getContentType())) {
                meta.setContentType(file.getContentType());
            }
            client.putObject(ossProperties.getBucket(), objectKey, in, meta);
        } catch (IOException e) {
            throw new BusinessException(500, "读取上传文件失败");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(500, "上传至对象存储失败");
        } finally {
            shutdownQuietly(client);
        }

        String publicUrl = buildPublicUrl(objectKey);
        return Map.of(
                "url", publicUrl,
                "objectKey", objectKey
        );
    }

    private void validateExtension(String scene, String ext) {
        String normalizedScene = normalizeScene(scene);
        Set<String> allowed = SCENE_EXTENSIONS.get(normalizedScene);
        if (allowed == null) {
            throw new BusinessException(400, "不支持的上传场景");
        }
        if (!StringUtils.hasText(ext) || !allowed.contains(ext.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(400, "文件格式不允许上传");
        }
    }

    private String normalizeScene(String scene) {
        if (!StringUtils.hasText(scene)) {
            return "image";
        }
        return switch (scene.toLowerCase(Locale.ROOT)) {
            case "cover", "hall", "craft", "news", "banner" -> "image";
            case "course", "resource" -> "video";
            case "audio" -> "audio";
            case "file" -> "document";
            case "resource_file" -> "resource_file";
            case "subtitle" -> "subtitle";
            case "model3d", "model", "glb" -> "model3d";
            default -> scene.toLowerCase(Locale.ROOT);
        };
    }

    private String buildObjectKey(String scene, String ext) {
        String normalized = normalizeScene(scene);
        String folder = switch (normalized) {
            case "video" -> "videos";
            case "audio" -> "audios";
            case "document" -> "files";
            case "resource_file" -> resourceFileFolder(ext);
            case "subtitle" -> "subtitles";
            case "model3d" -> "models";
            default -> "images";
        };
        String month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        return folder + "/" + month + "/" + UUID.randomUUID().toString().replace("-", "") + "." + ext.toLowerCase(Locale.ROOT);
    }

    private String resourceFileFolder(String ext) {
        if (!StringUtils.hasText(ext)) {
            return "files";
        }
        return switch (ext.toLowerCase(Locale.ROOT)) {
            case "mp4", "mov" -> "videos";
            case "mp3", "m4a", "wav" -> "audios";
            default -> "files";
        };
    }

    private String buildPublicUrl(String objectKey) {
        String domain = StringUtils.hasText(ossProperties.getCdnDomain())
                ? trimTrailingSlash(ossProperties.getCdnDomain())
                : ("https://" + ossProperties.getBucket() + "." + ossProperties.getEndpoint().replace("https://", "").replace("http://", ""));
        return domain + "/" + objectKey;
    }

    private String resolveObjectKey(String stored) {
        if (!stored.startsWith("http://") && !stored.startsWith("https://")) {
            return stored.startsWith("/") ? stored.substring(1) : stored;
        }
        try {
            URI uri = URI.create(stored);
            String path = uri.getPath();
            if (!StringUtils.hasText(path)) {
                return "";
            }
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (Exception e) {
            return "";
        }
    }

    private String rewriteCdnHost(String signedUrl) {
        if (!StringUtils.hasText(ossProperties.getCdnDomain())) {
            return signedUrl;
        }
        try {
            URI signed = URI.create(signedUrl);
            URI cdn = URI.create(trimTrailingSlash(ossProperties.getCdnDomain()));
            return new URI(
                    cdn.getScheme(),
                    signed.getUserInfo(),
                    cdn.getHost(),
                    cdn.getPort(),
                    signed.getPath(),
                    signed.getQuery(),
                    signed.getFragment()
            ).toString();
        } catch (Exception e) {
            return signedUrl;
        }
    }

    private String extractExtension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private OSS buildClient() {
        return new OSSClientBuilder().build(
                ossProperties.getEndpoint(),
                ossProperties.getAccessKey(),
                ossProperties.getSecretKey()
        );
    }

    private void shutdownQuietly(OSS client) {
        if (client != null) {
            try {
                client.shutdown();
            } catch (Exception ignored) {
                // 关闭连接失败不影响主流程
            }
        }
    }

    private String trimTrailingSlash(String url) {
        String s = url.trim();
        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }
}
