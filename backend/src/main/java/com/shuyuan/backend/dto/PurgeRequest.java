package com.shuyuan.backend.dto;

import lombok.Data;

/**
 * 彻底删除的确认体。
 *
 * <p>密码放请求体而不是查询参数：查询串会落进 Nginx access log、浏览器历史和 Referer。
 */
@Data
public class PurgeRequest {

    /** 当前管理员的登录密码；仅高危档（有业务引用）需要 */
    private String password;
}
