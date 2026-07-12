package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/** 导入失败行明细（用于导出核对） */
@Data
public class MemberImportErrorRow {

    @ExcelProperty("行号")
    private Integer rowNum;

    @ExcelProperty("学号")
    private String studentNo;

    @ExcelProperty("姓名")
    private String realName;

    @ExcelProperty("失败原因")
    private String reason;
}
