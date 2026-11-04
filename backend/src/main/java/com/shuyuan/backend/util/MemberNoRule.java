package com.shuyuan.backend.util;

import com.shuyuan.backend.config.ShuyuanProperties;

import java.util.regex.Pattern;

/**
 * 学号 / 工号的清洗与格式核对，导入和后台新增共用。
 *
 * <p>只在建号时查。登录不查：建号前的老账号可能不合这个格式，查了就登不进来。
 */
public final class MemberNoRule {

    /** Excel 把长数字显示成 7.70333E+11，拷出来的就是这串，后几位已经丢了 */
    private static final Pattern SCIENTIFIC = Pattern.compile("\\d(\\.\\d+)?[eE][+-]?\\d+");
    private static final Pattern DIGITS = Pattern.compile("\\d+");

    private MemberNoRule() {
    }

    /** 去掉所有空白（含全角空格、不换行空格、零宽字符），全角数字字母转半角 */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (Character.isWhitespace(c) || Character.isSpaceChar(c) || isZeroWidth(c)) {
                continue;
            }
            if (c >= '！' && c <= '～') {
                c = (char) (c - 0xFEE0);
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /** 合格式返回 null，否则返回给管理员看的原因 */
    public static String problem(String no, ShuyuanProperties.MemberNo rule) {
        if (rule == null || !rule.checks() || no == null || no.isEmpty()) {
            return null;
        }
        if (DIGITS.matcher(no).matches()
                && (no.length() == rule.getStudentDigits() || no.length() == rule.getStaffDigits())) {
            return null;
        }
        if (SCIENTIFIC.matcher(no).matches()) {
            return "学号 / 工号「" + no + "」被 Excel 改成了科学计数法，后几位已经丢了。"
                    + "把这一列设为文本格式，重新粘贴原始号码";
        }
        if (DIGITS.matcher(no).matches()) {
            return "学号 / 工号「" + no + "」是 " + no.length() + " 位，" + describe(rule);
        }
        return "学号 / 工号「" + no + "」只能是数字，" + describe(rule);
    }

    /** 「学号应为 12 位数字，工号应为 7 位数字」 */
    public static String describe(ShuyuanProperties.MemberNo rule) {
        return "学号应为 " + rule.getStudentDigits() + " 位数字，工号应为 " + rule.getStaffDigits() + " 位数字";
    }

    private static boolean isZeroWidth(char c) {
        return c == '​' || c == '‌' || c == '‍' || c == '⁠' || c == '﻿';
    }
}
