package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class CategorySaveRequest {

    /** news / hall / craft / course / resource */
    private String type;
    private String name;
    private Integer sort;
    /** 1 启用 0 停用 */
    private Integer status;
}
