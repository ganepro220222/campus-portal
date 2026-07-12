package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.util.regex.Pattern;

/** 小程序师生密码策略（首次改密与自助修改） */
public final class MemberPasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");

    private MemberPasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BusinessException(400, "密码至少 " + MIN_LENGTH + " 位");
        }
        if (!LETTER.matcher(password).find()) {
            throw new BusinessException(400, "密码须包含字母");
        }
        if (!DIGIT.matcher(password).find()) {
            throw new BusinessException(400, "密码须包含数字");
        }
    }
}
