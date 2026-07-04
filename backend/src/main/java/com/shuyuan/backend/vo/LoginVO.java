package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginVO {

    private String token;
    private MemberVO member;
}
