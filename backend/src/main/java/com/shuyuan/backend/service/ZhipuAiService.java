package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * 大模型调用：优先智谱 GLM；无 Key 时由 AiClientService 走本地 fallback
 */
@Service
@RequiredArgsConstructor
public class ZhipuAiService {

    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public boolean canUse() {
        ShuyuanProperties.Ai ai = properties.getAi();
        return ai.getApiKey() != null && !ai.getApiKey().isBlank()
                && ("zhipu".equalsIgnoreCase(ai.getProvider())
                || "auto".equalsIgnoreCase(ai.getProvider()));
    }

    public String chat(String systemPrompt, String userPrompt) {
        if (!canUse()) {
            throw new BusinessException(500, "AI 服务未配置");
        }
        ShuyuanProperties.Ai ai = properties.getAi();
        String url = trimSlash(ai.getBaseUrl()) + "/chat/completions";
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", ai.getModel());
            ArrayNode messages = body.putArray("messages");
            ObjectNode sys = messages.addObject();
            sys.put("role", "system");
            sys.put("content", systemPrompt);
            ObjectNode user = messages.addObject();
            user.put("role", "user");
            user.put("content", userPrompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + ai.getApiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BusinessException(502, "AI 服务暂时不可用，请稍后重试");
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new BusinessException(502, "AI 未返回有效内容");
            }
            return content.asText().trim();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "AI 服务调用失败，请稍后重试");
        }
    }

    private String trimSlash(String base) {
        if (base == null) {
            return "";
        }
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
