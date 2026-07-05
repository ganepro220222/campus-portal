package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("stat_content")
public class StatContent {

    private LocalDate date;
    private String targetType;
    private Long targetId;
    private Integer viewCount;
    private Integer clickCount;
}
