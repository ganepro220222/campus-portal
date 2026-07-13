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
 * 阿里云录音文件识别（nls-filetrans SubmitTask / GetTaskResult）
 */
@Slf4j
@Component
public class AliyunFileAsrProvider implements AsrProvider {

    private static final String HOST = "nls-filetrans.cn-shanghai.aliyuncs.com";
    private static final String API_VERSION = "2018-08-17";

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
                HOST,
                asr.getAccessKeyId(),
                asr.getAccessKeySecret(),
                "SubmitTask",
                API_VERSION,
                Map.of(
                        "AppKey", asr.getAppKey(),
                        "FileLink", mediaUrl,
                        "RegionId", asr.getRegion()
                ));
        JsonNode root = postForm(signed);
        if (root.hasNonNull("TaskId")) {
            return root.get("TaskId").asText();
        }
        String msg = root.path("StatusText").asText(root.path("Message").asText("提交 ASR 任务失败"));
        throw new IllegalStateException(msg);
    }

    @Override
    public AsrJobResult query(String taskId) {
        if (!isConfigured()) {
            return AsrJobResult.failed("ASR 未配置");
        }
        ShuyuanProperties.Asr asr = properties.getAsr();
        AliyunRpcSigner.SignedRequest signed = AliyunRpcSigner.signPost(
                HOST,
                asr.getAccessKeyId(),
                asr.getAccessKeySecret(),
                "GetTaskResult",
                API_VERSION,
                Map.of(
                        "TaskId", taskId,
                        "RegionId", asr.getRegion()
                ));
        JsonNode root = postForm(signed);
        String status = root.path("StatusText").asText("").toUpperCase();
        if ("SUCCESS".equals(status)) {
            String vtt = VttConverter.fromAliyunResult(root.path("Result").asText(""));
            if (vtt == null || vtt.isBlank()) {
                return AsrJobResult.failed("ASR 结果为空");
            }
            return AsrJobResult.success(vtt);
        }
        if ("FAILED".equals(status)) {
            return AsrJobResult.failed(root.path("StatusText").asText("识别失败"));
        }
        return AsrJobResult.processing();
    }

    private JsonNode postForm(AliyunRpcSigner.SignedRequest signed) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signed.url()))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(signed.body()))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readTree(response.body());
        } catch (Exception e) {
            log.warn("[asr] 请求异常: {}", e.getMessage());
            throw new IllegalStateException("ASR 请求失败: " + e.getMessage(), e);
        }
    }
}
