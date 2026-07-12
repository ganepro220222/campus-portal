package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/** 师生 Excel 导入行（列名须与模板一致） */
@Data
public class MemberImportRow {

    @ExcelProperty("学号")
    private String studentNo;

    @ExcelProperty("姓名")
    private String realName;

    @ExcelProperty("学院")
    private String college;

    @ExcelProperty("年级")
    private String grade;

    @ExcelProperty("手机号")
    private String phone;

    @ExcelProperty("身份证号")
    private String idCard;
}
