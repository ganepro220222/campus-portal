package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.context.MemberSession;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AccountLoginRequest;
import com.shuyuan.backend.dto.MemberChangePasswordRequest;
import com.shuyuan.backend.dto.WxBindRequest;
import com.shuyuan.backend.dto.WxLoginRequest;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.vo.LoginVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private LoginLockService loginLockService;
    @Mock
    private PointService pointService;
    @Mock
    private WxSessionService wxSessionService;

    @InjectMocks
    private AuthService authService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void wxLogin_returnsNeedBindWhenOpenidUnknown() {
        when(wxSessionService.resolveOpenid("code1")).thenReturn("wx_new");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(jwtUtils.createWxBindToken("wx_new")).thenReturn("bind-token");

        LoginVO vo = authService.wxLogin(wxRequest("code1"));

        assertTrue(vo.getNeedBind());
        assertEquals("bind-token", vo.getWxBindToken());
        verify(memberMapper, never()).insert(any(Member.class));
    }

    @Test
    void bindWxAccount_linksImportedMember() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        when(jwtUtils.parseWxBindOpenid("bind-token")).thenReturn("wx_new");
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
        when(memberMapper.selectById(9L)).thenReturn(member, member);
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
        when(jwtUtils.createToken(9L, "wx_new", 0)).thenReturn("jwt");

        WxBindRequest req = new WxBindRequest();
        req.setWxBindToken("bind-token");
        req.setStudentNo("2024001");
        req.setPassword("Admin@123");

        LoginVO vo = authService.bindWxAccount(req);

        assertNotNull(vo.getToken());
        ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        verify(memberMapper).updateById(captor.capture());
        assertEquals("wx_new", captor.getValue().getOpenid());
    }

    @Test
    void accountLogin_flagsMustChangePassword() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setMustChangePassword(1);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
        when(memberMapper.selectById(9L)).thenReturn(member, member);
        when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
        when(jwtUtils.createToken(9L, "acct:2024001", 0)).thenReturn("jwt");

        AccountLoginRequest req = new AccountLoginRequest();
        req.setStudentNo("2024001");
        req.setPassword("Admin@123");

        LoginVO vo = authService.accountLogin(req);

        assertTrue(vo.getMustChangePassword());
    }

    @Test
    void changePassword_bumpsTokenVersion() {
        Member member = importedMember();
        member.setTokenVersion(0);
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        account.setMustChangePassword(1);
        MemberContext.setMemberId(9L);
        try {
            when(memberMapper.selectById(9L)).thenReturn(member, member, member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
            when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
            when(jwtUtils.createToken(9L, "acct:2024001", 1)).thenReturn("jwt2");

            authService.changePassword(changeReq("Admin@123", "NewPass1"));

            ArgumentCaptor<Member> memberCaptor = ArgumentCaptor.forClass(Member.class);
            verify(memberMapper).updateById(memberCaptor.capture());
            assertEquals(1, memberCaptor.getValue().getTokenVersion());
        } finally {
            MemberContext.clear();
        }
    }

    @Test
    void changePassword_clearsMustChangeFlag() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        account.setMustChangePassword(1);
        MemberContext.setMemberId(9L);
        try {
            when(memberMapper.selectById(9L)).thenReturn(member, member, member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
            when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
            when(jwtUtils.createToken(9L, "acct:2024001", 1)).thenReturn("jwt2");

            LoginVO vo = authService.changePassword(changeReq("Admin@123", "NewPass1"));

            assertFalse(vo.getMustChangePassword());
            ArgumentCaptor<MemberAccount> captor = ArgumentCaptor.forClass(MemberAccount.class);
            verify(memberAccountMapper).updateById(captor.capture());
            assertEquals(0, captor.getValue().getMustChangePassword());
        } finally {
            MemberContext.clear();
        }
    }

    @Test
    void changePassword_mustChange_skipsOldPassword() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        account.setMustChangePassword(1);
        MemberContext.set(new MemberSession(9L, true));
        try {
            when(memberMapper.selectById(9L)).thenReturn(member, member, member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
            when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
            when(jwtUtils.createToken(9L, "acct:2024001", 1)).thenReturn("jwt2");

            LoginVO vo = authService.changePassword(changeReq(null, "NewPass1"));

            assertFalse(vo.getMustChangePassword());
            verify(loginLockService, never()).ensureNotLocked(anyString(), anyString());
        } finally {
            MemberContext.clear();
        }
    }

    @Test
    void changePassword_loggedInWithoutMustChange_requiresOldPassword() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        MemberContext.setMemberId(9L);
        try {
            when(memberMapper.selectById(9L)).thenReturn(member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.changePassword(changeReq(null, "NewPass1")));
            assertEquals(400, ex.getCode());
            assertTrue(ex.getMessage().contains("原密码"));
        } finally {
            MemberContext.clear();
        }
    }

    @Test
    void changePassword_wxCode_setsPasswordWithoutLogin() {
        Member member = importedMember();
        member.setOpenid("wx_real");
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        when(wxSessionService.resolveOpenid("code-wx")).thenReturn("wx_real");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(member);
        when(memberMapper.selectById(9L)).thenReturn(member, member);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
        when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
        when(jwtUtils.createToken(9L, "wx_real", 1)).thenReturn("jwt2");

        MemberChangePasswordRequest req = changeReq(null, "NewPass1");
        req.setWxCode("code-wx");
        LoginVO vo = authService.changePassword(req);

        assertNotNull(vo.getToken());
        assertFalse(vo.getMustChangePassword());
        ArgumentCaptor<MemberAccount> captor = ArgumentCaptor.forClass(MemberAccount.class);
        verify(memberAccountMapper).updateById(captor.capture());
        assertEquals(0, captor.getValue().getMustChangePassword());
    }

    @Test
    void changePassword_wxCode_unboundWechatRejected() {
        when(wxSessionService.resolveOpenid("code-new")).thenReturn("wx_unknown");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        MemberChangePasswordRequest req = changeReq(null, "NewPass1");
        req.setWxCode("code-new");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> authService.changePassword(req));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("尚未绑定"));
    }

    @Test
    void changePassword_wxCode_rejectsMismatchLoggedInMember() {
        Member other = importedMember();
        other.setId(8L);
        other.setOpenid("wx_other");
        MemberContext.setMemberId(9L);
        try {
            when(wxSessionService.resolveOpenid("code-other")).thenReturn("wx_other");
            when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(other);

            MemberChangePasswordRequest req = changeReq(null, "NewPass1");
            req.setWxCode("code-other");
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.changePassword(req));
            assertEquals(400, ex.getCode());
            assertTrue(ex.getMessage().contains("不一致"));
        } finally {
            MemberContext.clear();
        }
    }

    @Test
    void changePassword_rejectsSameAsCurrentHash() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        account.setMustChangePassword(1);
        MemberContext.set(new MemberSession(9L, true));
        try {
            when(memberMapper.selectById(9L)).thenReturn(member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.changePassword(changeReq(null, "Admin@123")));
            assertEquals(400, ex.getCode());
            assertTrue(ex.getMessage().contains("不能与当前密码相同"));
        } finally {
            MemberContext.clear();
        }
    }

    private static MemberChangePasswordRequest changeReq(String oldPassword, String newPassword) {
        MemberChangePasswordRequest req = new MemberChangePasswordRequest();
        req.setOldPassword(oldPassword);
        req.setNewPassword(newPassword);
        return req;
    }

    private static WxLoginRequest wxRequest(String code) {
        WxLoginRequest req = new WxLoginRequest();
        req.setCode(code);
        return req;
    }

    private Member importedMember() {
        Member member = new Member();
        member.setId(9L);
        member.setOpenid("acct:2024001");
        member.setNickname("张三");
        member.setPoints(0);
        member.setStatus(1);
        return member;
    }

    private MemberAccount importedAccount(Long memberId) {
        MemberAccount account = new MemberAccount();
        account.setMemberId(memberId);
        account.setStudentNo("2024001");
        account.setUsername("2024001");
        account.setPasswordHash(encoder.encode("Admin@123"));
        account.setStatus(1);
        return account;
    }
}
