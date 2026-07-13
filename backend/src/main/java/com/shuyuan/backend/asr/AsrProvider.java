package com.shuyuan.backend.asr;

/**
 * 语音识别供应商抽象（阿里云录音文件识别等）
 */
public interface AsrProvider {

    String name();

    boolean isConfigured();

    /** 提交音视频 URL，返回供应商任务 ID */
    String submit(String mediaUrl);

    /** 查询任务状态与结果 */
    AsrJobResult query(String taskId);
}
