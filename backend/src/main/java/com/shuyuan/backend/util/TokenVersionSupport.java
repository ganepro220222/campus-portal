package com.shuyuan.backend.util;

/** JWT token_version 字段辅助 */
public final class TokenVersionSupport {

    private TokenVersionSupport() {}

    public static int current(Integer stored) {
        return stored == null ? 0 : stored;
    }

    public static int bump(Integer stored) {
        return current(stored) + 1;
    }
}
