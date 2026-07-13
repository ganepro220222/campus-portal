package com.shuyuan.backend.dto;

import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class HallSaveRequest {

    @NotBlank(groups = Create.class, message = "展馆名称不能为空")
    @Size(max = 100, groups = {Create.class, Update.class}, message = "展馆名称不能超过100字")
    private String name;

    @Size(max = 50, groups = {Create.class, Update.class})
    private String shortName;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String cover;

    @Size(max = 16, groups = {Create.class, Update.class})
    private String coverFitMode;

    @Size(max = 10000, groups = {Create.class, Update.class})
    private String intro;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String vrUrl;

    private Long categoryId;

    @Min(value = 0, groups = {Create.class, Update.class})
    private Integer sort;

    /** 1 上架 0 下架 */
    @Min(value = 0, groups = {Create.class, Update.class})
    @Max(value = 1, groups = {Create.class, Update.class})
    private Integer status;

    /** 轮播图文（image） */
    private List<HallMediaItem> slides;

    /** 语音讲解地址 */
    @Size(max = 500, groups = {Create.class, Update.class})
    private String audioUrl;

    /** 语音时长说明，如「语音讲解 03:48」 */
    @Size(max = 50, groups = {Create.class, Update.class})
    private String audioTime;

    /** 沉浸式长卷章节（含章节内图文） */
    private List<HallSectionItem> sections;
}
