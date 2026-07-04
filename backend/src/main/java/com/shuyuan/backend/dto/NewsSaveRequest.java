package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class NewsSaveRequest {

    private String title;
    private String cover;
    private String summary;
    private String content;
    private Long categoryId;
    private Integer isTop;
}
