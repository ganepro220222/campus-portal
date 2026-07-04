package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberVO {

    private Long id;
    private String nickname;
    private String avatar;
    private String college;
    private Integer points;
}
