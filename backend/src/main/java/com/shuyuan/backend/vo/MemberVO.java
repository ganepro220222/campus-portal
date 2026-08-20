package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberVO {

    private Long id;
    private String nickname;
    private String avatar;
    private String realName;
    private String college;
    private String grade;
    private String phone;
    private Integer points;
}
