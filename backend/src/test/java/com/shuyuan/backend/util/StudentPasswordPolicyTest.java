package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @Test
    void placeholderOpenid_helpers() {
        assertEquals("acct:2024001", StudentPasswordPolicy.placeholderOpenid("2024001"));
        assertTrue(StudentPasswordPolicy.isPlaceholderOpenid("acct:2024001"));
        assertFalse(StudentPasswordPolicy.isPlaceholderOpenid("oXyz"));
    }
}
