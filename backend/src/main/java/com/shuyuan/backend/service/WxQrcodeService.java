package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 微信小程序码（getwxacode），dev-mode 或未配置凭证时返回 null 供调用方降级。
 */
@Slf4j
@Service
public class WxQrcodeService {

    private static final String WXACODE_URL =
            "https://api.weixin.qq.com/wxa/getwxacode?access_token=%s";

    private final WxAccessTokenService accessTokenService;
    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public WxQrcodeService(WxAccessTokenService accessTokenService,
                           ShuyuanProperties properties,
                           ObjectMapper objectMapper) {
        this.accessTokenService = accessTokenService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    /** @return PNG bytes，不可用时返回 null */
    public byte[] getWxaCode(String path, int width) {
        if (properties.getWx().isDevMode()) {
            return null;
        }
        String token = accessTokenService.getAccessToken();
        if (token == null || token.isBlank()) {
            return null;
        }
        String scenePath = normalizePath(path);
        int w = clampWidth(width);
        String cacheKey = scenePath + "|" + w;
        CacheEntry hit = cache.get(cacheKey);
        long now = System.currentTimeMillis();
        if (hit != null && now < hit.expiresAtMs) {
            return hit.bytes;
        }
        try {
            String url = String.format(WXACODE_URL, token);
            String body = objectMapper.writeValueAsString(Map.of(
                    "path", scenePath,
                    "width", w
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            byte[] bytes = response.body();
            if (bytes == null || bytes.length == 0) {
                return null;
            }
            if (looksLikeJsonError(bytes)) {
                log.warn("[wx] getwxacode 失败: {}", new String(bytes));
                return null;
            }
            cache.put(cacheKey, new CacheEntry(bytes, now + 3_600_000L));
            return bytes;
        } catch (Exception e) {
            log.warn("[wx] getwxacode 请求异常: {}", e.getMessage());
            return null;
        }
    }

    private static String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return "pages/index/index";
        }
        String p = path.trim();
        if (p.startsWith("/")) {
            p = p.substring(1);
        }
        return p;
    }

    private static int clampWidth(int width) {
        if (width < 280) {
            return 280;
        }
        if (width > 1280) {
            return 1280;
        }
        return width;
    }

    private boolean looksLikeJsonError(byte[] bytes) {
        if (bytes.length > 0 && bytes[0] == '{') {
            try {
                JsonNode root = objectMapper.readTree(bytes);
                return root.has("errcode") && root.path("errcode").asInt(0) != 0;
            } catch (Exception ignored) {
                return true;
            }
        }
        return false;
    }

    private record CacheEntry(byte[] bytes, long expiresAtMs) {}
}
