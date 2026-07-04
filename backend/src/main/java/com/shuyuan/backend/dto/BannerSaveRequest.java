package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class BannerSaveRequest {

    private String title;
    private String description;
    private String imageUrl;
    /** none / page / url */
    private String linkType;
    private String linkValue;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
}
