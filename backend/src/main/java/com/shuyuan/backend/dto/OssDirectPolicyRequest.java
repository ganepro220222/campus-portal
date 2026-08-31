package com.shuyuan.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OssDirectPolicyRequest {

    @NotBlank
    private String scene;

    @NotBlank
    private String fileName;

    @NotNull
    @Min(1)
    private Long size;
}
