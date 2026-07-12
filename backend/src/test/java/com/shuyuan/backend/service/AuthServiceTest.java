package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.dto.AccountLoginRequest;
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
        when(jwtUtils.createToken(9L, "wx_new")).thenReturn("jwt");

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
        when(jwtUtils.createToken(9L, "acct:2024001")).thenReturn("jwt");

        AccountLoginRequest req = new AccountLoginRequest();
        req.setStudentNo("2024001");
        req.setPassword("Admin@123");

        LoginVO vo = authService.accountLogin(req);

        assertTrue(vo.getMustChangePassword());
    }

    @Test
    void changePassword_clearsMustChangeFlag() {
        Member member = importedMember();
        MemberAccount account = importedAccount(member.getId());
        account.setId(1L);
        account.setMustChangePassword(1);
        MemberContext.setMemberId(9L);
        try {
            when(memberMapper.selectById(9L)).thenReturn(member, member);
            when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
            when(memberProfileMapper.selectById(9L)).thenReturn(new MemberProfile());
            when(jwtUtils.createToken(9L, "acct:2024001")).thenReturn("jwt2");

            LoginVO vo = authService.changePassword("Admin@123", "NewPass1");

            assertFalse(vo.getMustChangePassword());
            ArgumentCaptor<MemberAccount> captor = ArgumentCaptor.forClass(MemberAccount.class);
            verify(memberAccountMapper).updateById(captor.capture());
            assertEquals(0, captor.getValue().getMustChangePassword());
        } finally {
            MemberContext.clear();
        }
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
