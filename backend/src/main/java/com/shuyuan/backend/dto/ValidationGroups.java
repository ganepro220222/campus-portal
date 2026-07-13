package com.shuyuan.backend.dto;

/**
 * Bean Validation 分组：创建必填，更新允许部分字段。
 */
public final class ValidationGroups {

    public interface Create {}

    public interface Update {}

    private ValidationGroups() {}
}
