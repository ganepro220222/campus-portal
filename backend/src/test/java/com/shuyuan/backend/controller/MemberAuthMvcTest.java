package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.config.AuthInterceptor;
import com.shuyuan.backend.controller.api.ActivityController;
import com.shuyuan.backend.controller.api.AuthController;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.service.ActivityService;
import com.shuyuan.backend.service.ApiErrorMetrics;
import com.shuyuan.backend.service.AuthService;
import com.shuyuan.backend.service.EnrollService;
import com.shuyuan.backend.service.MemberAuthGate;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.vo.LoginVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 小程序会员鉴权：强制改密写拦截、禁用账号、token 版本。
 */
@ExtendWith(MockitoExtension.class)
class MemberAuthMvcTest {

    private MockMvc activityMockMvc;
    private MockMvc authMockMvc;

    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private ActivityService activityService;
    @Mock
    private EnrollService enrollService;
    @Mock
    private AuthService authService;

    private MemberAuthGate memberAuthGate;
    private AuthInterceptor authInterceptor;

    @BeforeEach
    void setUp() {
        memberAuthGate = new MemberAuthGate(jwtUtils, memberMapper, memberAccountMapper);
        authInterceptor = new AuthInterceptor(memberAuthGate);

        ActivityController activityController = new ActivityController(activityService, enrollService);
        activityMockMvc = MockMvcBuilders.standaloneSetup(activityController)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(authInterceptor)
                .build();

        AuthController authController = new AuthController(authService);
        authMockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(authInterceptor)
                .build();
    }

    @Test
    void mustChangePassword_blocksEnrollWrite() throws Exception {
        stubActiveMemberWithMustChange(9L);

        activityMockMvc.perform(post("/api/v1/activities/1/enroll")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("请先修改密码后再操作"));

        verify(enrollService, never()).enroll(anyLong(), any());
    }

    @Test
    void mustChangePassword_allowsChangePasswordEndpoint() throws Exception {
        stubActiveMemberWithMustChange(9L);
        when(authService.changePassword(eq("old"), eq("NewPass1")))
                .thenReturn(LoginVO.builder().token("new").mustChangePassword(false).build());

        authMockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\":\"old\",\"newPassword\":\"NewPass1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void mustChangePassword_allowsRead() throws Exception {
        stubActiveMemberWithMustChange(9L);
        when(activityService.list(1, 20)).thenReturn(
                new com.shuyuan.backend.common.PageResult<>(java.util.List.of(), 0, 1, 20));

        activityMockMvc.perform(get("/api/v1/activities")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void disabledMember_rejectsWith403() throws Exception {
        when(jwtUtils.getMemberId("token")).thenReturn(9L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        Member member = new Member();
        member.setId(9L);
        member.setStatus(0);
        member.setTokenVersion(0);
        when(memberMapper.selectById(9L)).thenReturn(member);

        activityMockMvc.perform(post("/api/v1/activities/1/enroll")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("账号已被禁用"));
    }

    private void stubActiveMemberWithMustChange(Long memberId) {
        when(jwtUtils.getMemberId("token")).thenReturn(memberId);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        Member member = new Member();
        member.setId(memberId);
        member.setStatus(1);
        member.setTokenVersion(0);
        when(memberMapper.selectById(memberId)).thenReturn(member);
        MemberAccount account = new MemberAccount();
        account.setMemberId(memberId);
        account.setStatus(1);
        account.setMustChangePassword(1);
        when(memberAccountMapper.selectOne(any())).thenReturn(account);
    }
}
