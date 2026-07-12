package com.shuyuan.backend.util;

/**
 * 管理端报名 Excel 导出范围。
 */
public final class EnrollExportScope {

    /** 审核台账：待审 / 已通过 / 已拒绝（不含已取消） */
    public static final String AUDIT = "audit";

    /** 签到名单：仅已通过 */
    public static final String CHECKIN = "checkin";

    private EnrollExportScope() {
    }

    public static String normalize(String scope) {
        if (CHECKIN.equalsIgnoreCase(scope)) {
            return CHECKIN;
        }
        return AUDIT;
    }
}
