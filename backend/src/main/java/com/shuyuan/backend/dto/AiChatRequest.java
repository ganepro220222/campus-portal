package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiChatRequest {

    @NotBlank(message = "问题不能为空")
    @Size(max = 500, message = "问题过长，请控制在500字以内")
    private String question;
}
