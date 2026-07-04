package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class AnnouncementSaveRequest {

    private String content;
    private String linkUrl;
    private Integer sort;
    /** 1 滚动显示 0 静态 */
    private Integer isScroll;
    /** yyyy-MM-dd HH:mm，空表示立即/永久 */
    private String startTime;
    private String endTime;
    /** 1 启用 0 停用 */
    private Integer status;
}
