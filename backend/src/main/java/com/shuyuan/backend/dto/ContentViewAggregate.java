package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * event_log 在数据库端按内容或模块聚合后的浏览量。
 */
@Data
public class ContentViewAggregate {

    private String targetType;
    private Long targetId;
    private Long viewCount;
}
