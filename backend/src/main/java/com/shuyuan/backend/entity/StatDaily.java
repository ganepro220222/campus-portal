package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("stat_daily")
public class StatDaily {

    @TableId(type = IdType.INPUT)
    private LocalDate date;
    private Long pv;
    private Long uv;
    private Long dau;
    private Integer newMember;
    private Integer enrollCount;
}
