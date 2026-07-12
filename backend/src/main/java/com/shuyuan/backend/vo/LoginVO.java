package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginVO {

    private String token;
    private MemberVO member;
    /** 微信登录后需绑定学号时为 true */
    private Boolean needBind;
    /** 绑定学号时回传的短期凭证（约 10 分钟） */
    private String wxBindToken;
    /** 当前账号是否已绑定微信（学号登录响应） */
    private Boolean wxBound;
    /** 是否须修改初始密码（导入账号首次登录） */
    private Boolean mustChangePassword;
}
