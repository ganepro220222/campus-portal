package com.shuyuan.backend.dto;

import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActivitySaveRequest {

    @NotBlank(groups = Create.class, message = "活动标题不能为空")
    @Size(max = 200, groups = {Create.class, Update.class}, message = "活动标题不能超过200字")
    private String title;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String cover;

    @Size(max = 16, groups = {Create.class, Update.class})
    private String coverFitMode;

    @Size(max = 10000, groups = {Create.class, Update.class})
    private String intro;

    @Size(max = 200, groups = {Create.class, Update.class})
    private String location;

    @Size(max = 32, groups = {Create.class, Update.class}, message = "开始时间格式无效")
    private String startTime;

    @Size(max = 32, groups = {Create.class, Update.class}, message = "结束时间格式无效")
    private String endTime;

    @Size(max = 32, groups = {Create.class, Update.class})
    private String enrollStartTime;

    @Size(max = 32, groups = {Create.class, Update.class})
    private String enrollEndTime;

    /** 0 表示不限名额 */
    @Min(value = 0, groups = {Create.class, Update.class})
    private Integer quota;

    /** 是否需要审核：1 是 0 否 */
    @Min(value = 0, groups = {Create.class, Update.class})
    @Max(value = 1, groups = {Create.class, Update.class})
    private Integer needReview;
}
