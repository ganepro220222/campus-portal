package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/** 管理后台密码强度校验与临时密码生成 */
public final class AdminPasswordPolicy {

    private static final int MIN_LENGTH = 12;
    private static final Pattern UPPER = Pattern.compile("[A-Z]");
    private static final Pattern LOWER = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final String UPPERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWERS = "abcdefghjkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SPECIAL = "!@#$%&*";
    private static final SecureRandom RANDOM = new SecureRandom();

    private AdminPasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BusinessException(400, "密码至少 " + MIN_LENGTH + " 位");
        }
        if (!UPPER.matcher(password).find()) {
            throw new BusinessException(400, "密码须包含大写字母");
        }
        if (!LOWER.matcher(password).find()) {
            throw new BusinessException(400, "密码须包含小写字母");
        }
        if (!DIGIT.matcher(password).find()) {
            throw new BusinessException(400, "密码须包含数字");
        }
    }

    /** 生成符合策略的临时密码（16 位） */
    public static String generateTemporary() {
        List<Character> chars = new ArrayList<>();
        chars.add(pick(UPPERS));
        chars.add(pick(LOWERS));
        chars.add(pick(DIGITS));
        chars.add(pick(SPECIAL));
        String all = UPPERS + LOWERS + DIGITS + SPECIAL;
        while (chars.size() < 16) {
            chars.add(all.charAt(RANDOM.nextInt(all.length())));
        }
        Collections.shuffle(chars, RANDOM);
        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            sb.append(c);
        }
        return sb.toString();
    }

    private static char pick(String pool) {
        return pool.charAt(RANDOM.nextInt(pool.length()));
    }
}
