package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentPasswordPolicyTest {

    @Test
    void resolveInitialPassword_prefersIdCardSuffix() {
        assertEquals("011234", StudentPasswordPolicy.resolveInitialPassword("2024001", "520101200001011234"));
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
