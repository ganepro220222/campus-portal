package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class NewsSaveRequest {

    private String title;
    private String cover;
    /** fill=裁切填满 fit=完整显示 */
    private String coverFitMode;
    private String summary;
    private String content;
    private Long categoryId;
    private Integer isTop;
}
