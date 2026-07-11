package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class AdminUserSaveRequest {
    private String username;
    private String password;
    private Long roleId;
    private String realName;
    private Integer status;
}
