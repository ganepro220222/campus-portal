package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class CraftSaveRequest {

    private String name;
    private String cover;
    private String coverFitMode;
    private Long categoryId;
    private String introZh;
    private String introEn;
    /** 固定为多角度图片（小程序仅支持多图鉴赏） */
    private String previewType;
    /** @deprecated 历史字段，保存时不再写入 */
    private String model3dUrl;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** 多角度鉴赏图，按 sort 排序 */
    private List<CraftImageItem> images;
    /** 购买咨询联系方式 */
    private CraftContactSave contact;
}
