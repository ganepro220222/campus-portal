package com.shuyuan.backend.dto;

import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CourseSaveRequest {

    @NotBlank(groups = Create.class, message = "课程名称不能为空")
    @Size(max = 200, groups = {Create.class, Update.class}, message = "课程名称不能超过200字")
    private String name;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String cover;

    @Size(max = 16, groups = {Create.class, Update.class})
    private String coverFitMode;

    private Long categoryId;

    @Size(max = 200, groups = {Create.class, Update.class})
    private String targetAudience;

    @Min(value = 1, groups = {Create.class, Update.class}, message = "课程时长须为正数")
    private Integer durationMinutes;

    /** yyyy-MM-dd 或 yyyy-MM-dd HH:mm */
    @Size(max = 32, groups = {Create.class, Update.class})
    private String startTime;

    @Size(max = 20000, groups = {Create.class, Update.class})
    private String intro;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String videoUrl;

    /** 手动配置字幕地址（.vtt） */
    @Size(max = 500, groups = {Create.class, Update.class})
    private String subtitleUrl;

    /** 1 上架 0 下架 */
    @Min(value = 0, groups = {Create.class, Update.class})
    @Max(value = 1, groups = {Create.class, Update.class})
    private Integer status;

    /** 配套资源 ID 列表，按顺序关联 */
    private List<Long> resourceIds;
}
