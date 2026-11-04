package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentPasswordPolicyTest {

    /* 下面的身份证号都是编的，只保证校验位算得对 */
    @Test
    void resolveInitialPassword_prefersIdCardSuffix() {
        assertEquals("011239", StudentPasswordPolicy.resolveInitialPassword("2024001", "520101200001011239"));
        assertEquals("01101X", StudentPasswordPolicy.resolveInitialPassword("2024001", "52010120000101101x"));
    }

    /** 名册里常见的空格、全角字符先洗掉再算 */
    @Test
    void resolveInitialPassword_身份证先清洗() {
        assertEquals("011239", StudentPasswordPolicy.resolveInitialPassword("2024001", " 520101\u00A0200001011239\u3000"));
        assertEquals("011239", StudentPasswordPolicy.resolveInitialPassword("2024001", "５２０１０１２００００１０１１２３９"));
    }

    /**
     * 身份证列在 Excel 里是数字格式：只剩 15 位有效数字，末 3 位成了 000。
     * 原来照样取后 6 位当初始密码，学生拿真号登不上，导入也不报错。
     */
    @Test
    void resolveInitialPassword_Excel截断的身份证要拦下() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("123456789012", "520101200001011000"));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("末 3 位是 000") && ex.getMessage().contains("文本格式"), ex.getMessage());
        assertFalse(ex.getMessage().contains("520101"), "原因里不能带出身份证号");
    }

    /** 末 3 位是 000 且校验位碰巧对上的，照样拦：截断的号有 1/11 能过校验 */
    @Test
    void resolveInitialPassword_000结尾即使校验位对也拦() {
        int[] w = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
        String body = "52010120000101800";
        int sum = 0;
        for (int i = 0; i < 17; i++) {
            sum += (body.charAt(i) - '0') * w[i];
        }
        assertEquals('0', "10X98765432".charAt(sum % 11), "前提：这个号的校验位确实是 0");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("123456789012", "520101200001018000"));
        assertTrue(ex.getMessage().contains("末 3 位是 000"), ex.getMessage());
    }

    @Test
    void resolveInitialPassword_身份证不合规的几种() {
        String sci = assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("123456789012", "5.20101E+17")).getMessage();
        assertTrue(sci.contains("科学计数法"), sci);
        String typo = assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("123456789012", "520101200001011238")).getMessage();
        assertTrue(typo.contains("校验位不对"), typo);
        String shortId = assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("123456789012", "52010120000101")).getMessage();
        assertTrue(shortId.contains("18 位") && shortId.contains("留空"), shortId);
        /* 以前不足 6 位的乱填会悄悄退回学号；现在填了就得是真号，没有就留空 */
        assertThrows(BusinessException.class,
                () -> StudentPasswordPolicy.resolveInitialPassword("2024001", "无"));
    }

    @Test
    void resolveInitialPassword_身份证留空退回学号() {
        assertEquals("789012", StudentPasswordPolicy.resolveInitialPassword("123456789012", "  "));
        assertEquals("234567", StudentPasswordPolicy.resolveInitialPassword("1234567", ""));
    }

    @Test
    void resolveInitialPassword_fallsBackToStudentNoSuffix() {
        assertEquals("024001", StudentPasswordPolicy.resolveInitialPassword("2024001", null));
    }

    /**
     * 字母数字混合的学号／工号：数字不足 6 位时要回退到整串，而不是直接判失败。
     *
     * <p>原实现的回退条件是「一个数字都没有」，导致同样 6 位、同样是合法学号，
     * 纯字母的 ABCDEF 能用，含 1–5 个数字的 AB1234 反而被拒。教师工号常是这种混合格式，
     * 真按原逻辑走，整批教师会卡在导入的第一步。
     */
    @Test
    void resolveInitialPassword_混合学号回退到整串() {
        assertEquals("AB1234", StudentPasswordPolicy.resolveInitialPassword("AB1234", null));
        assertEquals("ABCDEF", StudentPasswordPolicy.resolveInitialPassword("ABCDEF", null));
        assertEquals("BC1234", StudentPasswordPolicy.resolveInitialPassword("ABC1234", null));
        // 数字够 6 位时仍优先取数字，行为与原来完全一致
        assertEquals("123456", StudentPasswordPolicy.resolveInitialPassword("A123456", null));
        assertEquals("240001", StudentPasswordPolicy.resolveInitialPassword("20240001", null));
    }

    /** 分隔符不计入长度，避免「20-24-01」这种被算成 8 位却只有 6 位有效字符 */
    @Test
    void resolveInitialPassword_忽略分隔符() {
        assertEquals("202401", StudentPasswordPolicy.resolveInitialPassword("20-24-01", null));
        assertEquals("AB1234", StudentPasswordPolicy.resolveInitialPassword("AB-12-34", null));
    }

    /** 真的凑不够 6 位仍要明确失败，不能悄悄生成一个短密码 */
    @Test
    void resolveInitialPassword_过短仍然失败() {
        for (String tooShort : new String[]{"T2024", "2024", "AB12", "X"}) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> StudentPasswordPolicy.resolveInitialPassword(tooShort, null));
            assertEquals(400, ex.getCode());
            assertTrue(ex.getMessage().contains("学号过短"), ex.getMessage());
        }
    }

    @Test
    void placeholderOpenid_helpers() {
        assertEquals("acct:2024001", StudentPasswordPolicy.placeholderOpenid("2024001"));
        assertTrue(StudentPasswordPolicy.isPlaceholderOpenid("acct:2024001"));
        assertFalse(StudentPasswordPolicy.isPlaceholderOpenid("oXyz"));
    }
}
