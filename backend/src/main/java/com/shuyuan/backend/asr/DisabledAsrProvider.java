package com.shuyuan.backend.asr;

import org.springframework.stereotype.Component;

@Component
public class DisabledAsrProvider implements AsrProvider {

    @Override
    public String name() {
        return "none";
    }

    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public String submit(String mediaUrl) {
        throw new IllegalStateException("ASR 未配置");
    }

    @Override
    public AsrJobResult query(String taskId) {
        return AsrJobResult.failed("ASR 未配置");
    }
}
