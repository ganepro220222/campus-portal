package com.shuyuan.backend.service;

import com.shuyuan.backend.asr.AliyunFileAsrProvider;
import com.shuyuan.backend.asr.AsrProvider;
import com.shuyuan.backend.asr.DisabledAsrProvider;
import com.shuyuan.backend.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AsrService {

    private final List<AsrProvider> providers;
    private final DisabledAsrProvider disabledAsrProvider;

    public AsrService(List<AsrProvider> providers, DisabledAsrProvider disabledAsrProvider) {
        this.providers = providers;
        this.disabledAsrProvider = disabledAsrProvider;
    }

    public boolean isConfigured() {
        return active().isConfigured();
    }

    public String submit(String mediaUrl) {
        AsrProvider provider = active();
        if (!provider.isConfigured()) {
            throw new BusinessException(503, "ASR 未配置，请设置 ASR_ACCESS_KEY_ID / ASR_ACCESS_KEY_SECRET / ASR_APP_KEY，或手动上传字幕");
        }
        try {
            return provider.submit(mediaUrl);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "提交 ASR 任务失败: " + e.getMessage());
        }
    }

    public com.shuyuan.backend.asr.AsrJobResult query(String taskId) {
        return active().query(taskId);
    }

    private AsrProvider active() {
        for (AsrProvider p : providers) {
            if (p instanceof DisabledAsrProvider) {
                continue;
            }
            if (p.isConfigured()) {
                return p;
            }
        }
        if (providers.stream().anyMatch(p -> p instanceof AliyunFileAsrProvider)) {
            return providers.stream()
                    .filter(p -> p instanceof AliyunFileAsrProvider)
                    .findFirst()
                    .orElse(disabledAsrProvider);
        }
        return disabledAsrProvider;
    }
}
