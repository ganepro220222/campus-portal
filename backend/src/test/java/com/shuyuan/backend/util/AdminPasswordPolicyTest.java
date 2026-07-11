package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminPasswordPolicyTest {

    @Test
    void validate_acceptsStrongPassword() {
        AdminPasswordPolicy.validate("ShuyuanAdmin1");
    }

    @Test
    void validate_rejectsShortPassword() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> AdminPasswordPolicy.validate("Short1a"));
        assertEquals(400, ex.getCode());
    }

    @Test
    void generateTemporary_meetsPolicy() {
        String pwd = AdminPasswordPolicy.generateTemporary();
        assertTrue(pwd.length() >= 12);
        AdminPasswordPolicy.validate(pwd);
    }
}
