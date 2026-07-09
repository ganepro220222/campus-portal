package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.Member;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 微信 access_token 获取（订阅消息、内容安全等共用）
 */
@Slf4j
@Service
public class WxAccessTokenService {

    private static final String TOKEN_URL =
            "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";

    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private volatile String cachedToken;
    private volatile long expiresAtMs;

    public WxAccessTokenService(ShuyuanProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    /** dev-mode 或未配置时返回 null，调用方应跳过微信 API */
    public synchronized String getAccessToken() {
        if (properties.getWx().isDevMode()) {
            return null;
        }
        String appid = properties.getWx().getAppid();
        String secret = properties.getWx().getSecret();
        if (appid == null || appid.isBlank() || secret == null || secret.isBlank()) {
            return null;
        }
        long now = System.currentTimeMillis();
        if (cachedToken != null && now < expiresAtMs - 60_000) {
            return cachedToken;
        }
        try {
            String url = String.format(TOKEN_URL, appid, secret);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (root.hasNonNull("access_token")) {
                cachedToken = root.get("access_token").asText();
                int expiresIn = root.path("expires_in").asInt(7200);
                expiresAtMs = now + expiresIn * 1000L;
                return cachedToken;
            }
            log.warn("[wx] access_token 获取失败: {}", response.body());
        } catch (Exception e) {
            log.warn("[wx] access_token 请求异常: {}", e.getMessage());
        }
        return null;
    }
}
