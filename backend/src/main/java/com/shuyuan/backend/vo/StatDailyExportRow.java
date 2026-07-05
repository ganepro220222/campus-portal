package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

@Data
public class StatDailyExportRow {

    @ExcelProperty("日期")
    private String date;

    @ExcelProperty("浏览量(PV)")
    private Long pv;

    @ExcelProperty("独立访客(UV)")
    private Long uv;

    @ExcelProperty("日活(DAU)")
    private Long dau;

    @ExcelProperty("新增用户")
    private Integer newMember;

    @ExcelProperty("报名次数")
    private Integer enrollCount;
}
