package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 活动报名表单
 */
@Data
public class EnrollRequest {

    /** 报名姓名（可空，默认取个人资料） */
    private String name;
    /** 联系电话（可空，默认取个人资料） */
    private String phone;
    private String college;
    private String grade;
}
