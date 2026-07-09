package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** 小程序 wx.requestSubscribeMessage 授权结果上报 */
@Data
public class SubscribeRecordRequest {

    @NotBlank
    private String scene;

    @NotBlank
    private String templateId;

    @NotNull
    private Boolean accepted;
}
