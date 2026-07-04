package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 报名名单 Excel 导出行
 */
@Data
public class EnrollExportRow {

    @ExcelProperty("姓名")
    private String name;

    @ExcelProperty("手机号")
    private String phone;

    @ExcelProperty("学院")
    private String college;

    @ExcelProperty("年级")
    private String grade;

    @ExcelProperty("状态")
    private String statusLabel;

    @ExcelProperty("凭证码")
    private String voucherCode;

    @ExcelProperty("报名时间")
    private String createTime;
}
