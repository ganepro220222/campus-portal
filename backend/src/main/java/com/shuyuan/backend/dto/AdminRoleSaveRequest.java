package com.shuyuan.backend.dto;

import lombok.Data;

@Data
public class AdminRoleSaveRequest {
    private String roleName;
    /** 权限标识列表，不含 admin:super 时按勾选保存 */
    private java.util.List<String> permissions;
}
