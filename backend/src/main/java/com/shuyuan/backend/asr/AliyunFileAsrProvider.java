package com.shuyuan.backend.asr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * 阿里云录音文件识别（filetrans：SubmitTask POST / GetTaskResult GET，2018-08-17）
 */
@Slf4j
@Component
public class AliyunFileAsrProvider implements AsrProvider {

    private static final String API_VERSION = "2018-08-17";
    private static final String TASK_VERSION = "4.0";
    /** 小程序字幕单行字数，官方范围 [4, 50] */
    private static final int SENTENCE_MAX_LENGTH = 22;

    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public AliyunFileAsrProvider(ShuyuanProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "aliyun";
    }

    @Override
    public boolean isConfigured() {
        ShuyuanProperties.Asr asr = properties.getAsr();
        return "aliyun".equalsIgnoreCase(asr.getProvider())
                && StringUtils.hasText(asr.getAccessKeyId())
                && StringUtils.hasText(asr.getAccessKeySecret())
                && StringUtils.hasText(asr.getAppKey());
    }

    @Override
    public String submit(String mediaUrl) {
        if (!isConfigured()) {
            throw new IllegalStateException("ASR 未配置");
        }
        ShuyuanProperties.Asr asr = properties.getAsr();
        AliyunRpcSigner.SignedRequest signed = AliyunRpcSigner.signPost(
                filetransHost(asr.getRegion()),
                asr.getAccessKeyId(),
                asr.getAccessKeySecret(),
                "SubmitTask",
                API_VERSION,
                Map.of(
                        "Task", buildTaskJson(objectMapper, asr.getAppKey(), mediaUrl),
                        "RegionId", regionOrDefault(asr.getRegion())
                ));
        JsonNode root = send(signed);
        if (root.hasNonNull("TaskId")) {
            return root.get("TaskId").asText();
        }
        String msg = root.path("StatusText").asText(root.path("Message").asText("提交 ASR 任务失败"));
        int code = root.path("StatusCode").asInt(0);
        throw new IllegalStateException(code > 0 ? msg + " (" + code + ")" : msg);
    }

    @Override
    public AsrJobResult query(String taskId) {
        if (!isConfigured()) {
            return AsrJobResult.failed("ASR 未配置");
        }
        ShuyuanProperties.Asr asr = properties.getAsr();
        AliyunRpcSigner.SignedRequest signed = AliyunRpcSigner.signGet(
                filetransHost(asr.getRegion()),
                asr.getAccessKeyId(),
                asr.getAccessKeySecret(),
                "GetTaskResult",
                API_VERSION,
                Map.of(
                        "TaskId", taskId,
                        "RegionId", regionOrDefault(asr.getRegion())
                ));
        return parseQueryResult(send(signed));
    }

    static String filetransHost(String region) {
        return "filetrans." + regionOrDefault(region) + ".aliyuncs.com";
    }

    static String regionOrDefault(String region) {
        return StringUtils.hasText(region) ? region.trim() : "cn-shanghai";
    }

    static String buildTaskJson(ObjectMapper mapper, String appKey, String fileLink) {
        try {
            var node = mapper.createObjectNode();
            node.put("appkey", appKey);
            node.put("file_link", fileLink);
            node.put("version", TASK_VERSION);
            node.put("enable_words", false);
            node.put("enable_sample_rate_adaptive", true);
            node.put("enable_inverse_text_normalization", true);
            node.put("sentence_max_length", SENTENCE_MAX_LENGTH);
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new IllegalStateException("构造 ASR Task 失败", e);
        }
    }

    static AsrJobResult parseQueryResult(JsonNode root) {
        String status = root.path("StatusText").asText("").toUpperCase();
        if ("SUCCESS".equals(status)) {
            String vtt = VttConverter.fromAliyunResult(extractResultJson(root));
            if (vtt == null || vtt.isBlank()) {
                return AsrJobResult.failed("ASR 结果为空");
            }
            return AsrJobResult.success(vtt);
        }
        if ("FAILED".equals(status) || status.contains("FAIL") || status.contains("ERROR")) {
            String msg = root.path("StatusText").asText("识别失败");
            int code = root.path("StatusCode").asInt(0);
            return AsrJobResult.failed(code > 0 ? msg + " (" + code + ")" : msg);
        }
        return AsrJobResult.processing();
    }

    static String extractResultJson(JsonNode root) {
        JsonNode result = root.path("Result");
        if (result.isMissingNode() || result.isNull()) {
            return "";
        }
        if (result.isTextual()) {
            return result.asText();
        }
        return result.toString();
    }

    private JsonNode send(AliyunRpcSigner.SignedRequest signed) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(signed.url()))
                    .timeout(Duration.ofSeconds(20));
            if ("GET".equals(signed.method())) {
                builder.GET();
            } else {
                builder.header("Content-Type", "application/x-www-form-urlencoded")
                        .POST(HttpRequest.BodyPublishers.ofString(signed.body()));
            }
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                String body = response.body() == null ? "" : response.body();
                String snippet = body.length() > 240 ? body.substring(0, 240) : body;
                throw new IllegalStateException("ASR HTTP " + response.statusCode() + ": " + snippet);
            }
            return objectMapper.readTree(response.body());
        } catch (Exception e) {
            log.warn("[asr] 请求异常: {}", e.getMessage());
            throw new IllegalStateException("ASR 请求失败: " + e.getMessage(), e);
        }
    }
}
