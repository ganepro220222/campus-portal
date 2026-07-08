package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgeDocSaveRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "正文不能为空")
    private String content;
}
