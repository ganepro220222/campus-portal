package com.shuyuan.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WxBindRequest {

    @NotBlank(message = "绑定凭证不能为空")
    private String wxBindToken;

    @NotBlank(message = "学号/账号不能为空")
    private String studentNo;

    @NotBlank(message = "密码不能为空")
    private String password;
}
