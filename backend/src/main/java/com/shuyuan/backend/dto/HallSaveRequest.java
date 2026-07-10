package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class HallSaveRequest {

    private String name;
    private String shortName;
    private String cover;
    private String intro;
    private String vrUrl;
    private Long categoryId;
    private Integer sort;
    /** 1 上架 0 下架 */
    private Integer status;
    /** 轮播图文（image） */
    private List<HallMediaItem> slides;
    /** 语音讲解地址 */
    private String audioUrl;
    /** 语音时长说明，如「语音讲解 03:48」 */
    private String audioTime;
}
