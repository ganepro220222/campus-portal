package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class AdminResetPasswordRequest {
    /** 留空则系统生成临时密码 */
    private String newPassword;
}
