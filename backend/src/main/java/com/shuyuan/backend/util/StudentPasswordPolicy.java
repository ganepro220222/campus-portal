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
        /*
         * 优先取纯数字后 6 位；数字不够 6 位时，回退到「字母数字」清洗后的整串。
         *
         * <p>原来的回退条件是「一个数字都没有」，于是同样 6 位的学号，纯字母的 ABCDEF 能用，
         * 含 1–5 个数字的 AB1234 反而被拒——数字被单独拎出来只剩 4 位，又不肯退回整串。
         * 教师工号常是字母加数字的混合格式，这一条会直接把整批人挡在导入之外。
         */
        String digits = studentNo.replaceAll("\\D", "");
        String source = digits.length() >= 6 ? digits : studentNo.replaceAll("[^A-Za-z0-9]", "");
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
