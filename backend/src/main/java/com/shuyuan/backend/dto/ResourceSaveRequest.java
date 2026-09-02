package com.shuyuan.backend.dto;

import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResourceSaveRequest {

    @NotBlank(groups = Create.class, message = "资源名称不能为空")
    @Size(max = 200, groups = {Create.class, Update.class})
    private String name;

    @NotBlank(groups = Create.class, message = "文件地址不能为空")
    @Size(max = 500, groups = {Create.class, Update.class})
    private String fileUrl;

    @Size(max = 500, groups = {Create.class, Update.class})
    private String previewUrl;

    /** pdf / word / ppt / xls / xlsx / mp4 / mp3 / aac / m4a */
    @NotBlank(groups = Create.class, message = "请选择文件格式")
    @Size(max = 20, groups = {Create.class, Update.class})
    private String fileType;

    /** 文件大小（KB） */
    @Min(value = 0, groups = {Create.class, Update.class})
    private Integer fileSizeKb;

    private Long categoryId;

    /** 兼容旧客户端保留；保存接口忽略此字段，上下架请使用 publish/unpublish。 */
    @Min(value = 0, groups = {Create.class, Update.class})
    @Max(value = 1, groups = {Create.class, Update.class})
    private Integer status;
}
