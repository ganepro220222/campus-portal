package com.shuyuan.backend.common.context;

/**
 * 当前登录用户上下文（请求线程内有效）
 */
public final class MemberContext {

    private static final ThreadLocal<MemberSession> SESSION = new ThreadLocal<>();

    private MemberContext() {}

    public static void set(MemberSession session) {
        SESSION.set(session);
    }

    /** @deprecated 测试或遗留代码；生产路径请使用 {@link #set(MemberSession)} */
    @Deprecated
    public static void setMemberId(Long memberId) {
        if (memberId == null) {
            SESSION.remove();
        } else {
            SESSION.set(new MemberSession(memberId, false));
        }
    }

    public static Long getMemberId() {
        MemberSession session = SESSION.get();
        return session != null ? session.memberId() : null;
    }

    public static boolean mustChangePassword() {
        MemberSession session = SESSION.get();
        return session != null && session.mustChangePassword();
    }

    public static void clear() {
        SESSION.remove();
    }
}
