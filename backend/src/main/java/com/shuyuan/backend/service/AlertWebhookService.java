package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 低成本告警：钉钉 / 企业微信机器人 Webhook（E2-1）。
 * 未配置 webhook 或 disabled 时静默跳过，不影响主业务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertWebhookService {

    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ConcurrentHashMap<String, Instant> lastSentAt = new ConcurrentHashMap<>();

    /**
     * 发送文本告警。同一 alertKey 在冷却期内不重复发送。
     *
     * @return true 表示已尝试发送（不代表对方必达）
     */
    public boolean sendText(String alertKey, String title, String detail) {
        ShuyuanProperties.Alert alert = properties.getAlert();
        if (!alert.isEnabled() || !StringUtils.hasText(alert.getWebhookUrl())) {
            return false;
        }
        if (isInCooldown(alertKey, alert.getCooldownMinutes())) {
            log.debug("告警冷却中，跳过: {}", alertKey);
            return false;
        }

        String content = "【云端书院】" + title + "\n" + detail;
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("msgtype", "text");
            Map<String, String> text = new LinkedHashMap<>();
            text.put("content", content);
            body.put("text", text);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(alert.getWebhookUrl().trim()))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                lastSentAt.put(alertKey, Instant.now());
                log.info("告警已发送: {} status={}", alertKey, response.statusCode());
                return true;
            }
            log.warn("告警 Webhook 返回非 2xx: key={} status={} body={}",
                    alertKey, response.statusCode(), response.body());
        } catch (Exception e) {
            log.warn("告警 Webhook 发送失败: {} - {}", alertKey, e.getMessage());
        }
        return false;
    }

    private boolean isInCooldown(String alertKey, int cooldownMinutes) {
        Instant last = lastSentAt.get(alertKey);
        if (last == null) {
            return false;
        }
        return Instant.now().isBefore(last.plus(Duration.ofMinutes(Math.max(1, cooldownMinutes))));
    }
}
