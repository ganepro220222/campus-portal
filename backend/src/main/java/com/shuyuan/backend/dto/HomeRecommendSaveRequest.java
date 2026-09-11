package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class HomeRecommendSaveRequest {

    /** news / hall / course；新建必填，编辑忽略 */
    private String moduleType;
    /** 对应内容 ID；新建必填，编辑忽略 */
    private Long targetId;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
}
