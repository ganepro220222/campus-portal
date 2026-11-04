package com.shuyuan.backend.util;

import com.shuyuan.backend.config.ShuyuanProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/* 号码都是编的，只按配置的位数：学号 12 位、工号 7 位 */
class MemberNoRuleTest {

    private static final ShuyuanProperties.MemberNo RULE = new ShuyuanProperties.MemberNo();

    @Test
    void 默认学号12位工号7位() {
        assertEquals(12, RULE.getStudentDigits());
        assertEquals(7, RULE.getStaffDigits());
    }

    @Test
    void 学号12位工号7位都放行() {
        assertNull(MemberNoRule.problem("123456789012", RULE));
        assertNull(MemberNoRule.problem("1234567", RULE));
    }

    @Test
    void 位数不对写明是几位和应该几位() {
        String p = MemberNoRule.problem("12345678901", RULE);
        assertTrue(p.contains("是 11 位") && p.contains("学号应为 12 位") && p.contains("工号应为 7 位"), p);
        assertTrue(MemberNoRule.problem("123456", RULE).contains("是 6 位"));
    }

    @Test
    void 有字母或小数点不放行() {
        assertTrue(MemberNoRule.problem("AB1234567890", RULE).contains("只能是数字"));
        assertTrue(MemberNoRule.problem("123456789012.0", RULE).contains("只能是数字"));
    }

    /** Excel 把 12 位数字显示成 1.23457E+11，抄出来的就是这串，后几位已经没了 */
    @Test
    void 科学计数法单独说清楚() {
        String p = MemberNoRule.problem("1.23457E+11", RULE);
        assertTrue(p.contains("科学计数法") && p.contains("文本格式"), p);
    }

    @Test
    void 任一位数设0就不查() {
        ShuyuanProperties.MemberNo off = new ShuyuanProperties.MemberNo();
        off.setStaffDigits(0);
        assertNull(MemberNoRule.problem("T2024", off));
        assertNull(MemberNoRule.problem("12345678901", off));
        assertNull(MemberNoRule.problem("12345678901", null));
    }

    @Test
    void 清洗空白和全角() {
        assertEquals("123456789012", MemberNoRule.normalize(" 1234 5678 9012　"));
        assertEquals("123456789012", MemberNoRule.normalize("﻿123456789012​"));
        assertEquals("123456789012", MemberNoRule.normalize("１２３４５６７８９０１２"));
        assertEquals("AB12", MemberNoRule.normalize("ＡＢ１２"));
        assertNull(MemberNoRule.normalize(null));
    }
}
