package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MemberPasswordPolicyTest {

    @Test
    void validate_acceptsStrongPassword() {
        assertDoesNotThrow(() -> MemberPasswordPolicy.validate("Abc12345"));
    }

    @Test
    void validate_rejectsTooShort() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> MemberPasswordPolicy.validate("Ab1"));
        assertEquals("密码至少 8 位", ex.getMessage());
    }

    @Test
    void validate_requiresLetterAndDigit() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> MemberPasswordPolicy.validate("12345678"));
        assertEquals("密码须包含字母", ex.getMessage());
    }
}
