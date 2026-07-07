package com.shuyuan.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseProgressRequest {

    @NotNull(message = "播放位置不能为空")
    @Min(value = 0, message = "播放位置不能为负数")
    private Integer lastPositionSeconds;

    @Min(value = 0, message = "总时长不能为负数")
    private Integer totalDurationSeconds;
}
