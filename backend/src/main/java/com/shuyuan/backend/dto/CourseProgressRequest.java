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

    /** 播放页从 /play 拿到的教学视频版本；缺省时仅初始版本课程可上报 */
    @Min(value = 1, message = "视频版本无效")
    private Long videoRevision;
}
