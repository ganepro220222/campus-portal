package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class CourseSaveRequest {

    private String name;
    private String cover;
    private String coverFitMode;
    private Long categoryId;
    private String targetAudience;
    private Integer durationMinutes;
    /** yyyy-MM-dd 或 yyyy-MM-dd HH:mm */
    private String startTime;
    private String intro;
    private String videoUrl;
    /** 手动配置字幕地址（.vtt） */
    private String subtitleUrl;
    /** 1 上架 0 下架 */
    private Integer status;
    /** 配套资源 ID 列表，按顺序关联 */
    private List<Long> resourceIds;
}
