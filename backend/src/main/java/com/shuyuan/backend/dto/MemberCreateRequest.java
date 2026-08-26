package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 后台单个新增师生账号。
 *
 * <p>字段与 Excel 导入模板一一对应，两条路建出来的账号完全一致。
 */
@Data
public class MemberCreateRequest {

    /** 学号，必填，全库唯一 */
    private String studentNo;

    /** 姓名，必填 */
    private String realName;

    /** 学院 */
    private String college;

    /** 年级 */
    private String grade;

    /** 手机号 */
    private String phone;

    /** 身份证号；仅用于取后 6 位作初始密码，不入库 */
    private String idCard;
}
