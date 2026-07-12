package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AiAssistantConfigSaveRequest {

    @NotBlank(message = "欢迎语不能为空")
    private String welcomeText;

    private List<String> suggestQuestions;
    private List<String> searchHotTags;
}
