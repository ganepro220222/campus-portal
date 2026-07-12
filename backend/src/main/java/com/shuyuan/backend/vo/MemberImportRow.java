package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 师生 Excel 导入行。
 * 表头支持多种常见写法（校方内部表经简单改名后可直接导入，不必逐格手抄）。
 */
@Data
public class MemberImportRow {

    @ExcelProperty(value = {"学号", "学生学号", "学号/工号", "工号", "账号", "student_no", "StudentNo"})
    private String studentNo;

    @ExcelProperty(value = {"姓名", "学生姓名", "名字", "真实姓名", "name", "real_name", "RealName"})
    private String realName;

    @ExcelProperty(value = {"学院", "院系", "所在学院", "学院名称", "college", "College"})
    private String college;

    @ExcelProperty(value = {"年级", "入学年级", "grade", "Grade"})
    private String grade;

    @ExcelProperty(value = {"手机号", "手机", "联系电话", "电话", "mobile", "phone", "Phone"})
    private String phone;

    @ExcelProperty(value = {"身份证号", "身份证", "证件号码", "身份证号码", "id_card", "idCard", "IDCard"})
    private String idCard;
}
