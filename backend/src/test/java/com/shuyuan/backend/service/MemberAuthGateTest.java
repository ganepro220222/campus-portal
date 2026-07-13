package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberSession;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.util.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberAuthGateTest {

    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;

    @InjectMocks
    private MemberAuthGate memberAuthGate;

    @Test
    void resolveMemberSession_returnsNullForNonMemberToken() {
        when(jwtUtils.getMemberId("admin-token")).thenReturn(null);
        assertNull(memberAuthGate.resolveMemberSession("admin-token"));
    }

    @Test
    void resolveMemberSession_rejectsDisabledMember() {
        when(jwtUtils.getMemberId("token")).thenReturn(9L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        Member member = activeMember(9L);
        member.setStatus(0);
        when(memberMapper.selectById(9L)).thenReturn(member);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> memberAuthGate.resolveMemberSession("token"));
        assertEquals(403, ex.getCode());
    }

    @Test
    void resolveMemberSession_rejectsStaleTokenVersion() {
        when(jwtUtils.getMemberId("token")).thenReturn(9L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        Member member = activeMember(9L);
        member.setTokenVersion(2);
        when(memberMapper.selectById(9L)).thenReturn(member);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> memberAuthGate.resolveMemberSession("token"));
        assertEquals(401, ex.getCode());
    }

    @Test
    void resolveMemberSession_rejectsDisabledAccount() {
        when(jwtUtils.getMemberId("token")).thenReturn(9L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        when(memberMapper.selectById(9L)).thenReturn(activeMember(9L));
        MemberAccount account = activeAccount(9L);
        account.setStatus(0);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> memberAuthGate.resolveMemberSession("token"));
        assertEquals(403, ex.getCode());
    }

    @Test
    void resolveMemberSession_flagsMustChangePassword() {
        when(jwtUtils.getMemberId("token")).thenReturn(9L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        when(memberMapper.selectById(9L)).thenReturn(activeMember(9L));
        MemberAccount account = activeAccount(9L);
        account.setMustChangePassword(1);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

        MemberSession session = memberAuthGate.resolveMemberSession("token");
        assertNotNull(session);
        assertTrue(session.mustChangePassword());
    }

    @Test
    void blocksWriteForMustChangePassword_blocksEnrollButAllowsChangePassword() {
        MemberSession session = new MemberSession(9L, true);
        MockHttpServletRequest enroll = new MockHttpServletRequest("POST", "/api/v1/activities/1/enroll");
        MockHttpServletRequest changePwd = new MockHttpServletRequest("POST", "/api/v1/auth/change-password");
        MockHttpServletRequest read = new MockHttpServletRequest("GET", "/api/v1/activities");

        assertTrue(memberAuthGate.blocksWriteForMustChangePassword(enroll, session));
        assertFalse(memberAuthGate.blocksWriteForMustChangePassword(changePwd, session));
        assertFalse(memberAuthGate.blocksWriteForMustChangePassword(read, session));
    }

    private static Member activeMember(Long id) {
        Member member = new Member();
        member.setId(id);
        member.setOpenid("acct:" + id);
        member.setStatus(1);
        member.setTokenVersion(0);
        return member;
    }

    private static MemberAccount activeAccount(Long memberId) {
        MemberAccount account = new MemberAccount();
        account.setMemberId(memberId);
        account.setStatus(1);
        return account;
    }
}
