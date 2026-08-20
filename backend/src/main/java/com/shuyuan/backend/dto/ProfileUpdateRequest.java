package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 个人资料编辑（member + member_profile）
 */
@Data
public class ProfileUpdateRequest {

    /** 展示昵称（member.nickname，选填） */
    private String nickname;
    /** 真实姓名（member_profile.real_name，必填） */
    private String realName;
    /** 学院 */
    private String college;
    /** 年级，如 2024 级 */
    private String grade;
    /** 手机号（必填，用于活动报名预填） */
    private String phone;
}
