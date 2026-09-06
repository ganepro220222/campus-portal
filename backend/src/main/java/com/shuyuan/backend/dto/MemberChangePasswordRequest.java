package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MemberChangePasswordRequest {

    /** 日常自助改密必填；强制改密或微信验证改密可空 */
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    private String newPassword;

    /** 微信 jscode：解析到的 openid 必须已绑定本账号，通过后可不再校验原密码 */
    private String wxCode;
}
