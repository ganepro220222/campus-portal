package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteToggleRequest {

    @NotBlank(message = "请指定收藏类型")
    private String targetType;

    @NotNull(message = "请指定收藏对象")
    private Long targetId;
}
