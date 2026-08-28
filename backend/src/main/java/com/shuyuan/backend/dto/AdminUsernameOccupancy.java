package com.shuyuan.backend.dto;

import lombok.Data;

/** sys_user 登录名占用（含回收站软删行），由原生 SQL 查询，不受 @TableLogic 过滤 */
@Data
public class AdminUsernameOccupancy {

    private Long id;
    private Integer isDeleted;

    public boolean recycled() {
        return isDeleted != null && isDeleted == 1;
    }
}
