package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AdminLoginVO {

    private String token;
    private Long adminId;
    private String username;
    private String realName;
    private Long roleId;
    private String roleName;
    private Set<String> permissions;
}
