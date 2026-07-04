package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class ActivitySaveRequest {

    private String title;
    private String cover;
    private String intro;
    private String location;
    private String startTime;
    private String endTime;
    private String enrollStartTime;
    private String enrollEndTime;
    /** 0 表示不限名额 */
    private Integer quota;
    /** 是否需要审核：1 是 0 否 */
    private Integer needReview;
}
