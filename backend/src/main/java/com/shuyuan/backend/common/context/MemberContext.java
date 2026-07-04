package com.shuyuan.backend.common.context;

/**
 * 当前登录用户上下文（请求线程内有效）
 */
public final class MemberContext {

    private static final ThreadLocal<Long> MEMBER_ID = new ThreadLocal<>();

    private MemberContext() {}

    public static void setMemberId(Long memberId) {
        MEMBER_ID.set(memberId);
    }

    public static Long getMemberId() {
        return MEMBER_ID.get();
    }

    public static void clear() {
        MEMBER_ID.remove();
    }
}
