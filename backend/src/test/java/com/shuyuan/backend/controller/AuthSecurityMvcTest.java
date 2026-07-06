package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.AdminAuthInterceptor;
import com.shuyuan.backend.controller.admin.AdminBannerController;
import com.shuyuan.backend.controller.api.AuthController;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.service.AdminBannerService;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.AuthService;
import com.shuyuan.backend.util.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 登录与后台鉴权基础场景：401 / 参数校验（standalone MockMvc，不依赖 MySQL/Redis）
 */
@ExtendWith(MockitoExtension.class)
class AuthSecurityMvcTest {

    private MockMvc authMockMvc;
    private MockMvc adminMockMvc;

    @Mock
    private AuthService authService;
    @Mock
    private AdminBannerService adminBannerService;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private SysRoleMapper sysRoleMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authService);
        authMockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        AdminBannerController adminController = new AdminBannerController(adminBannerService);
        AdminAuthInterceptor adminAuthInterceptor = new AdminAuthInterceptor(
                jwtUtils, sysUserMapper, sysRoleMapper, adminPermissionService);
        adminMockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addInterceptors(adminAuthInterceptor)
                .build();
    }

    @Test
    void accountLogin_invalidBody_returns400() throws Exception {
        authMockMvc.perform(post("/api/v1/auth/account-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void adminApi_withoutToken_returns401() throws Exception {
        adminMockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void adminApi_disabledUser_returns403() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(0);
        when(sysUserMapper.selectById(1L)).thenReturn(user);

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403));
    }
}
