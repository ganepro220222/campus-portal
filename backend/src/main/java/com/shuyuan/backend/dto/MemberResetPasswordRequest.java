package com.shuyuan.backend.dto;

import lombok.Data;

/** 后台重置师生账号密码 */
@Data
public class MemberResetPasswordRequest {
    /** 留空则由系统生成临时密码（推荐）；填写则须满足师生密码策略 */
    private String newPassword;
}
