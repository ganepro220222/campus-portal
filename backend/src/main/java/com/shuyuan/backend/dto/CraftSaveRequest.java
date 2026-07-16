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
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** 多角度鉴赏图，按 sort 排序 */
    private List<CraftImageItem> images;
    /** 购买咨询联系方式 */
    private CraftContactSave contact;
}
