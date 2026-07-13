package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 协议/内容文档保存请求（隐私政策、用户协议，富文本 HTML）。
 */
@Data
public class ContentDocSaveRequest {

    private String privacy;

    private String agreement;
}
