package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class ResourceSaveRequest {

    private String name;
    private String fileUrl;
    private String previewUrl;
    /** pdf / word / ppt / mp4 / mp3 */
    private String fileType;
    /** 文件大小（KB） */
    private Integer fileSizeKb;
    private Long categoryId;
    /** 1 上架 0 下架 */
    private Integer status;
}
