package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class NavItemSaveRequest {

    private String label;
    private String icon;
    private String path;
    private Integer sort;
    private Integer status;
}
