package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * event_log 在数据库端完成的单日 PV/UV 聚合结果。
 */
@Data
public class StatsDailyAggregate {

    private Long pv;
    private Long uv;
}
