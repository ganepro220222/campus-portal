package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class HallSectionItem {

    private String title;
    private Integer sort;
    /** 章节内图文 */
    private List<HallMediaItem> items;
}
