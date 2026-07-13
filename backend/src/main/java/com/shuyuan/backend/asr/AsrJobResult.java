package com.shuyuan.backend.asr;

/**
 * ASR 任务查询结果
 */
public record AsrJobResult(
        AsrJobState state,
        String vttContent,
        String errorMessage
) {
    public static AsrJobResult processing() {
        return new AsrJobResult(AsrJobState.PROCESSING, null, null);
    }

    public static AsrJobResult success(String vtt) {
        return new AsrJobResult(AsrJobState.SUCCESS, vtt, null);
    }

    public static AsrJobResult failed(String message) {
        return new AsrJobResult(AsrJobState.FAILED, null, message);
    }
}
