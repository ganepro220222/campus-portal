package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/** 小程序师生密码策略（首次改密、自助修改与后台重置） */
public final class MemberPasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");

    /*
     * 临时密码的字符集刻意剔除了 0/O/1/l/I 这几个易混字符。
     * 这串密码的典型用法是辅导员在电话或微信上念给学生听，
     * 念错一个字符换来的是又一次「登录不上」的来回。
     */
    private static final String UPPERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWERS = "abcdefghjkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final int TEMPORARY_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private MemberPasswordPolicy() {
    }

    /**
     * 生成后台重置用的临时密码：8 位，字母 + 数字，必然通过 {@link #validate}。
     *
     * <p>刻意不复用「学号后 6 位」那条初始密码规则：一个学院三四百人，学号在同学之间
     * 是公开的，重置后到本人登录前的那段时间里，谁都能拿学号把这个账号登进去。
     */
    public static String generateTemporary() {
        List<Character> chars = new ArrayList<>();
        chars.add(pick(UPPERS));
        chars.add(pick(LOWERS));
        chars.add(pick(DIGITS));
        String all = UPPERS + LOWERS + DIGITS;
        while (chars.size() < TEMPORARY_LENGTH) {
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
