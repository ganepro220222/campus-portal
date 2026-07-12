package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

/** 师生导入初始密码：优先身份证后 6 位，否则学号后 6 位 */
public final class StudentPasswordPolicy {

    private StudentPasswordPolicy() {
    }

    public static String resolveInitialPassword(String studentNo, String idCard) {
        String fromId = extractIdCardSuffix(idCard);
        if (fromId != null) {
            return fromId;
        }
        if (studentNo == null || studentNo.isBlank()) {
            throw new BusinessException(400, "学号不能为空，无法生成初始密码");
        }
        String digits = studentNo.replaceAll("\\D", "");
        String source = digits.isBlank() ? studentNo.trim() : digits;
        if (source.length() < 6) {
            throw new BusinessException(400, "学号过短且未提供身份证号，无法生成初始密码");
        }
        return source.substring(source.length() - 6);
    }

    static String extractIdCardSuffix(String idCard) {
        if (idCard == null || idCard.isBlank()) {
            return null;
        }
        String normalized = idCard.trim().toUpperCase();
        String digits = normalized.replaceAll("[^0-9X]", "");
        if (digits.length() < 6) {
            return null;
        }
        return digits.substring(digits.length() - 6);
    }

    /** 导入账号占位 openid，绑定微信后替换为真实 openid */
    public static String placeholderOpenid(String studentNo) {
        return "acct:" + studentNo.trim();
    }

    public static boolean isPlaceholderOpenid(String openid) {
        return openid != null && openid.startsWith("acct:");
    }
}
