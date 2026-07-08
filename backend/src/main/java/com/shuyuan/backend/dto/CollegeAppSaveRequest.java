package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CollegeAppSaveRequest {

    @NotBlank(message = "请填写学院名称")
    private String name;
    private String appid;
    private String path;
    private String iconUrl;
    private String description;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** manual / jump / embed_h5 / api_sync */
    private String contentType;
    private String contentUrl;
    private String apiToken;
}
