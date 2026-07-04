package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class CraftSaveRequest {

    private String name;
    private String cover;
    private Long categoryId;
    private String introZh;
    private String introEn;
    /** multi_image 多角度图片 / model3d 3D 模型 */
    private String previewType;
    /** GLB 模型 CDN 地址（previewType=model3d 时使用） */
    private String model3dUrl;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** 多角度鉴赏图，按 sort 排序 */
    private List<CraftImageItem> images;
    /** 购买咨询联系方式 */
    private CraftContactSave contact;
}
