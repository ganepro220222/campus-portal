package com.shuyuan.backend.common;

/**
 * 稳定业务错误键，供前端/小程序分支，勿依赖 message 文案。
 */
public final class ApiErrorKeys {

    public static final String MEMBER_PASSWORD_CHANGE_REQUIRED = "MEMBER_PASSWORD_CHANGE_REQUIRED";
    public static final String ADMIN_PASSWORD_CHANGE_REQUIRED = "ADMIN_PASSWORD_CHANGE_REQUIRED";

    private ApiErrorKeys() {
    }
}
