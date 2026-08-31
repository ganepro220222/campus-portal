package com.shuyuan.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ListObjectsRequest;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.OSSObjectSummary;
import com.aliyun.oss.model.ObjectListing;
import com.aliyun.oss.model.ObjectMetadata;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.util.CdnUrlAuth;
import com.shuyuan.backend.util.CourseVideoUrlPolicy;
import com.shuyuan.backend.util.OssEndpointSupport;
import com.shuyuan.backend.util.OssManagedObjectKey;
import com.shuyuan.backend.util.UploadContentInspector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 对象存储：后台上传、签名 URL 下发（私有 Bucket + CDN）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssService {

    public record ManagedObject(String key, Date lastModified) {}

    private static final Map<String, Set<String>> SCENE_EXTENSIONS = buildSceneExtensions();

    private static Map<String, Set<String>> buildSceneExtensions() {
        Map<String, Set<String>> map = new HashMap<>();
        map.put("image", Set.of("jpg", "jpeg", "png", "webp", "gif"));
        map.put("feedback", Set.of("jpg", "jpeg", "png", "webp", "gif"));
        map.put("video", Set.of("mp4", "mov"));
        map.put("audio", Set.of("mp3", "m4a", "wav"));
        map.put("document", Set.of("pdf", "doc", "docx", "ppt", "pptx"));
        map.put("resource_file", Set.of("pdf", "doc", "docx", "ppt", "pptx", "mp4", "mp3"));
        map.put("subtitle", Set.of("vtt", "srt"));
        return Map.copyOf(map);
    }

    private final OssProperties ossProperties;
    private final AtomicBoolean cdnAuthIncompleteLogged = new AtomicBoolean();

    public boolean isEnabled() {
        return ossProperties.isEnabled()
                && StringUtils.hasText(ossProperties.getEndpoint())
                && StringUtils.hasText(ossProperties.getBucket())
                && StringUtils.hasText(ossProperties.getAccessKey())
                && StringUtils.hasText(ossProperties.getSecretKey());
    }

    /**
     * ASR 等安全敏感场景：校验可信 videos/ objectKey 后签名。
     */
    public String signTrustedVideoUrlForAsr(String stored) {
        String objectKey = CourseVideoUrlPolicy.resolveTrustedVideoObjectKey(stored, ossProperties, isEnabled());
        // 阿里云 filetrans 要自己拉 FileLink；私有桶必须走 OSS 签名原站，不能改写成 CDN。
        int ttl = Math.max(ossProperties.getSignExpireSeconds(), 4 * 3600);
        return signObjectKey(objectKey, ttl, false, true);
    }

    /**
     * 将库中存储的地址转为可访问 URL；OSS 未启用时原样返回（便于本地 dev 手填 CDN 地址）
     */
    public String signUrl(String stored) {
        return signStored(stored, ossProperties.getSignExpireSeconds(), true);
    }

    /** 按场景指定签名有效期（秒）；允许未签名 CDN（封面等公开元数据） */
    public String signUrl(String stored, int expireSeconds) {
        return signStored(stored, expireSeconds, true);
    }

    /** 视频/字幕/资料：短时授权。未配 CDN 鉴权时走 OSS 预签名，绝不返回永久 CDN URL。 */
    public String signMediaUrl(String stored) {
        return signStored(stored, ossProperties.getMediaSignExpireSeconds(), false);
    }

    private String signStored(String stored, int expireSeconds, boolean allowUnsignedCdn) {
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
        int ttl = expireSeconds > 0 ? expireSeconds : ossProperties.getSignExpireSeconds();
        return signObjectKey(objectKey, ttl, allowUnsignedCdn, false);
    }

    /** 服务端读取私有对象文本（字幕走 API，避免小程序直拉 CDN 被域名/编码拦住） */
    public String readUtf8Object(String stored) {
        if (!StringUtils.hasText(stored)) {
            throw new BusinessException(400, "字幕地址无效");
        }
        if (!isEnabled()) {
            throw new BusinessException(503, "对象存储未配置，无法读取字幕");
        }
        String objectKey = resolveObjectKey(stored.trim());
        if (!StringUtils.hasText(objectKey)) {
            throw new BusinessException(400, "字幕地址无效");
        }
        OSS client = null;
        try {
            client = buildTransferClient();
            OSSObject object = client.getObject(ossProperties.getBucket(), objectKey);
            try (InputStream in = object.getObjectContent()) {
                return new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(500, "读取字幕失败");
        } finally {
            shutdownQuietly(client);
        }
    }

    /**
     * 把私有对象写到 HTTP 响应。小程序 downloadFile 直拉 CDN 会被客户端误报域名未配置，资料改走 API。
     */
    public void writeObject(String stored, HttpServletResponse response) {
        if (!StringUtils.hasText(stored)) {
            throw new BusinessException(400, "文件地址无效");
        }
        if (!isEnabled()) {
            throw new BusinessException(503, "对象存储未配置，无法读取文件");
        }
        String objectKey = resolveObjectKey(stored.trim());
        if (!StringUtils.hasText(objectKey)) {
            throw new BusinessException(400, "文件地址无效");
        }
        OSS client = null;
        try {
            client = buildTransferClient();
            OSSObject object = client.getObject(ossProperties.getBucket(), objectKey);
            var meta = object.getObjectMetadata();
            String contentType = meta != null ? meta.getContentType() : null;
            response.setContentType(StringUtils.hasText(contentType) ? contentType : "application/octet-stream");
            if (meta != null && meta.getContentLength() > 0) {
                response.setContentLengthLong(meta.getContentLength());
            }
            String name = objectKey.contains("/")
                    ? objectKey.substring(objectKey.lastIndexOf('/') + 1)
                    : objectKey;
            response.setHeader("Content-Disposition", "inline; filename=\"" + name + "\"");
            try (InputStream in = object.getObjectContent()) {
                in.transferTo(response.getOutputStream());
                response.flushBuffer();
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(500, "读取文件失败");
        } finally {
            shutdownQuietly(client);
        }
    }

    private String signObjectKey(
            String objectKey, int expireSeconds, boolean allowUnsignedCdn, boolean forceOssOrigin) {
        if (!forceOssOrigin && cdnAuthReady()) {
            long expireAt = Instant.now().getEpochSecond() + Math.max(expireSeconds, 1);
            return CdnUrlAuth.signTypeA(
                    ossProperties.getCdnDomain(),
                    objectKey,
                    ossProperties.getCdnAuthKey(),
                    expireAt);
        }
        if (ossProperties.isCdnAuthEnabled()
                && !cdnAuthReady()
                && cdnAuthIncompleteLogged.compareAndSet(false, true)) {
            log.warn("[oss] OSS_CDN_AUTH_ENABLED=true 但域名/密钥/类型不完整，敏感媒体改走 OSS 预签名");
        }
        // 私有桶经 CDN 回源时，OSS 预签名参数挂在 CDN 上会双重鉴权 400。
        // 封面等公开元数据可以继续用未签名 CDN；登录课程/资料必须走 CDN 方式 A 或 OSS 原站预签名。
        if (!forceOssOrigin && allowUnsignedCdn && StringUtils.hasText(ossProperties.getCdnDomain())) {
            return buildPublicUrl(objectKey);
        }
        OSS client = null;
        try {
            client = buildSignClient();
            Date expire = new Date(System.currentTimeMillis() + expireSeconds * 1000L);
            return client.generatePresignedUrl(ossProperties.getBucket(), objectKey, expire).toString();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(500, "生成文件访问地址失败");
        } finally {
            shutdownQuietly(client);
        }
    }

    private boolean cdnAuthReady() {
        if (!ossProperties.isCdnAuthEnabled()
                || !StringUtils.hasText(ossProperties.getCdnDomain())
                || !StringUtils.hasText(ossProperties.getCdnAuthKey())) {
            return false;
        }
        String type = ossProperties.getCdnAuthType();
        return !StringUtils.hasText(type) || "A".equalsIgnoreCase(type.trim());
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
        try (InputStream raw = file.getInputStream();
             BufferedInputStream in = new BufferedInputStream(raw)) {
            in.mark(64);
            byte[] header = in.readNBytes(64);
            String contentType = UploadContentInspector.inspect(ext, header);
            in.reset();
            client = buildTransferClient();
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(file.getSize());
            meta.setContentType(contentType);
            log.info("[oss] upload scene={} key={} bytes={} via {}",
                    scene, objectKey, file.getSize(),
                    OssEndpointSupport.transferEndpoint(
                            ossProperties.getEndpoint(), ossProperties.getInternalEndpoint()));
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

    /** 上传文本内容（如 ASR 生成的 VTT） */
    public Map<String, String> uploadText(String scene, String ext, String content, String contentType) {
        if (!isEnabled()) {
            throw new BusinessException(503, "对象存储未配置，无法保存字幕文件");
        }
        if (content == null || content.isBlank()) {
            throw new BusinessException(400, "字幕内容为空");
        }
        byte[] bytes = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        validateExtension(scene, ext);
        String objectKey = buildObjectKey(scene, ext);
        OSS client = null;
        try {
            client = buildTransferClient();
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(bytes.length);
            meta.setContentType(StringUtils.hasText(contentType) ? contentType : "text/vtt; charset=utf-8");
            client.putObject(ossProperties.getBucket(), objectKey,
                    new java.io.ByteArrayInputStream(bytes), meta);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(500, "上传字幕至对象存储失败");
        } finally {
            shutdownQuietly(client);
        }
        return Map.of("url", buildPublicUrl(objectKey), "objectKey", objectKey);
    }

    /**
     * 删除后台前缀下的对象。未启用 / 非白名单 / 云端失败都返回 false，不抛给业务。
     */
    public boolean deleteObjectQuietly(String objectKey) {
        if (!OssManagedObjectKey.isManaged(objectKey)) {
            log.warn("[oss] skip delete unmanaged key={}", objectKey);
            return false;
        }
        if (!isEnabled()) {
            return false;
        }
        OSS client = null;
        try {
            client = buildTransferClient();
            client.deleteObject(ossProperties.getBucket(), objectKey);
            return true;
        } catch (Exception e) {
            log.warn("[oss] delete failed key={}", objectKey, e);
            return false;
        } finally {
            shutdownQuietly(client);
        }
    }

    /** 列出后台五个前缀下的对象（不含 craft- / exhibits）。 */
    public List<ManagedObject> listManagedObjects() {
        List<ManagedObject> out = new ArrayList<>();
        if (!isEnabled()) {
            return out;
        }
        OSS client = null;
        try {
            client = buildTransferClient();
            for (String prefix : OssManagedObjectKey.PREFIXES) {
                String marker = null;
                do {
                    ListObjectsRequest req = new ListObjectsRequest(ossProperties.getBucket())
                            .withPrefix(prefix)
                            .withMaxKeys(1000);
                    if (marker != null) {
                        req.setMarker(marker);
                    }
                    ObjectListing listing = client.listObjects(req);
                    for (OSSObjectSummary summary : listing.getObjectSummaries()) {
                        if (OssManagedObjectKey.isManaged(summary.getKey())) {
                            out.add(new ManagedObject(summary.getKey(), summary.getLastModified()));
                        }
                    }
                    marker = listing.isTruncated() ? listing.getNextMarker() : null;
                } while (marker != null);
            }
        } finally {
            shutdownQuietly(client);
        }
        return out;
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
            case "cover", "hall", "craft", "news", "banner", "feedback" -> "image";
            case "course", "resource" -> "video";
            case "audio" -> "audio";
            case "file" -> "document";
            case "resource_file" -> "resource_file";
            case "subtitle" -> "subtitle";
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
                : OssEndpointSupport.publicBucketBase(ossProperties.getBucket(), ossProperties.getEndpoint());
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

    private String extractExtension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    /** 上传 / 删除 / 读对象：有内网配置则走 VPC，不占用 ECS 5Mbps 公网。 */
    private OSS buildTransferClient() {
        return new OSSClientBuilder().build(
                OssEndpointSupport.transferEndpoint(
                        ossProperties.getEndpoint(), ossProperties.getInternalEndpoint()),
                ossProperties.getAccessKey(),
                ossProperties.getSecretKey()
        );
    }

    /** 预签名必须用外网 Endpoint，否则 ASR / 浏览器无法访问。 */
    private OSS buildSignClient() {
        return new OSSClientBuilder().build(
                OssEndpointSupport.publicEndpoint(ossProperties.getEndpoint()),
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
