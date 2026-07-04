package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class SubtitleUpdateRequest {

    /** 字幕文件 CDN 地址（.vtt） */
    private String subtitleUrl;
}
