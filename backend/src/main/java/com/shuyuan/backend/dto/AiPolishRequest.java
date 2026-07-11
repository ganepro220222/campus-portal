package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiPolishRequest {

    @NotBlank(message = "内容不能为空")
    @Size(max = 10000, message = "内容过长，请精简后再试")
    private String content;

    /** polish / expand / summarize / title / translate_en */
    @NotBlank(message = "操作类型不能为空")
    private String action;

    /** 文风偏好，如 cultural */
    private String tone;
}
