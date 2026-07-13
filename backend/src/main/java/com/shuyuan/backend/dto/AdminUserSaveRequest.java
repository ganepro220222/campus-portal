package com.shuyuan.backend.dto;

import com.shuyuan.backend.dto.ValidationGroups.Create;
import com.shuyuan.backend.dto.ValidationGroups.Update;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserSaveRequest {

    @NotBlank(groups = Create.class, message = "登录账号不能为空")
    @Size(min = 3, max = 50, groups = {Create.class, Update.class}, message = "登录账号长度须为 3～50 个字符")
    private String username;

    @Size(min = 8, max = 100, groups = {Create.class, Update.class}, message = "密码长度至少 8 位")
    private String password;

    @NotNull(groups = Create.class, message = "请选择角色")
    private Long roleId;

    @Size(max = 50, groups = {Create.class, Update.class})
    private String realName;

    @Min(value = 0, groups = {Create.class, Update.class})
    @Max(value = 1, groups = {Create.class, Update.class})
    private Integer status;
}
