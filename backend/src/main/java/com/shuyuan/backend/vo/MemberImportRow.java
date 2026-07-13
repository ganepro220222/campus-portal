package com.shuyuan.backend.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 师生 Excel 导入行。
 * 模板使用单行标准表头；导入时按 {@link #HEADER_ALIAS} 兼容校方内部表的多种列名写法。
 */
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

    /** 导入模板的标准表头（单行）。 */
    public static final List<String> TEMPLATE_HEADERS =
            List.of("学号", "姓名", "学院", "年级", "手机号", "身份证号");

    /** 归一化后的表头别名 -> 字段名，用于兼容校方内部表的多种列名写法。 */
    public static final Map<String, String> HEADER_ALIAS = buildAlias();

    private static Map<String, String> buildAlias() {
        Map<String, String> m = new HashMap<>();
        put(m, "studentNo", "学号", "学生学号", "学号/工号", "工号", "账号", "student_no", "StudentNo");
        put(m, "realName", "姓名", "学生姓名", "名字", "真实姓名", "name", "real_name", "RealName");
        put(m, "college", "学院", "院系", "所在学院", "学院名称", "college", "College");
        put(m, "grade", "年级", "入学年级", "grade", "Grade");
        put(m, "phone", "手机号", "手机", "联系电话", "电话", "mobile", "phone", "Phone");
        put(m, "idCard", "身份证号", "身份证", "证件号码", "身份证号码", "id_card", "idCard", "IDCard");
        return m;
    }

    private static void put(Map<String, String> m, String field, String... aliases) {
        for (String a : aliases) {
            m.put(normalizeHeader(a), field);
        }
    }

    /** 去除空白 / 下划线 / 连字符 / 斜杠并小写，用于表头模糊匹配。 */
    public static String normalizeHeader(String header) {
        return header == null ? "" : header.trim().toLowerCase().replaceAll("[\\s_/\\-]", "");
    }
}
