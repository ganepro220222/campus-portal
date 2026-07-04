package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class HallSaveRequest {

    private String name;
    private String cover;
    private String intro;
    private Long categoryId;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
}
