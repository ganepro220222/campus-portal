package com.shuyuan.backend.service;

import com.shuyuan.backend.common.ApiErrorKeys;
import com.shuyuan.backend.common.context.MemberSession;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class MemberAuthGateTest {

    @InjectMocks
    private MemberAuthGate memberAuthGate;

    @Test
    void mustChangePassword_blocksProfileReadAndWrite() {
        MemberSession session = new MemberSession(9L, true);
        assertTrue(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("GET", "/api/v1/profile"), session));
        assertTrue(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("PUT", "/api/v1/profile"), session));
        assertTrue(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("POST", "/api/v1/activities/1/enroll"), session));
    }

    @Test
    void mustChangePassword_allowsChangePasswordSessionAndRelogin() {
        MemberSession session = new MemberSession(9L, true);
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("POST", "/api/v1/auth/change-password"), session));
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("GET", "/api/v1/auth/session"), session));
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("POST", "/api/v1/auth/account-login"), session));
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("POST", "/api/v1/auth/wx-login"), session));
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("POST", "/api/v1/auth/wx-bind"), session));
    }

    @Test
    void mustChangePassword_allowsOptionsPreflight() {
        MemberSession session = new MemberSession(9L, true);
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("OPTIONS", "/api/v1/profile"), session));
    }

    @Test
    void normalSession_neverBlocks() {
        MemberSession session = new MemberSession(9L, false);
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("GET", "/api/v1/profile"), session));
        assertFalse(memberAuthGate.blocksForMustChangePassword(
                new MockHttpServletRequest("PUT", "/api/v1/profile"), session));
    }

    @Test
    void ensureAllowedOrThrow_usesStableErrorKey() {
        MemberSession session = new MemberSession(9L, true);
        MockHttpServletRequest blocked = new MockHttpServletRequest("GET", "/api/v1/profile/enrolls");
        try {
            memberAuthGate.ensureAllowedOrThrow(blocked, session);
            org.junit.jupiter.api.Assertions.fail("expected BusinessException");
        } catch (com.shuyuan.backend.common.exception.BusinessException ex) {
            org.junit.jupiter.api.Assertions.assertEquals(403, ex.getCode());
            org.junit.jupiter.api.Assertions.assertEquals(
                    ApiErrorKeys.MEMBER_PASSWORD_CHANGE_REQUIRED, ex.getErrorKey());
        }
    }
}
