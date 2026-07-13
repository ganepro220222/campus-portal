package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.AdminAuthInterceptor;
import com.shuyuan.backend.controller.admin.AdminAuthController;
import com.shuyuan.backend.controller.admin.AdminBannerController;
import com.shuyuan.backend.controller.api.AuthController;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.service.AdminAuthService;
import com.shuyuan.backend.service.AdminBannerService;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.ApiErrorMetrics;
import com.shuyuan.backend.service.AuthService;
import com.shuyuan.backend.util.JwtUtils;
import com.shuyuan.backend.vo.AdminLoginVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    @Mock
    private AdminAuthService adminAuthService;

    private AdminAuthInterceptor adminAuthInterceptor;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authService);
        authMockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .build();

        adminAuthInterceptor = new AdminAuthInterceptor(
                jwtUtils, sysUserMapper, sysRoleMapper, adminPermissionService);
        AdminBannerController adminController = new AdminBannerController(adminBannerService);
        adminMockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(adminAuthInterceptor)
                .build();
    }

    @Test
    void accountLogin_invalidBody_returns400() throws Exception {
        authMockMvc.perform(post("/api/v1/auth/account-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void adminApi_withoutToken_returns401() throws Exception {
        adminMockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void adminApi_disabledUser_returns403() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(0);
        user.setRoleId(2L);
        when(sysUserMapper.selectById(1L)).thenReturn(user);

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void adminApi_roleChangedInDb_rejectsStaleToken() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(1L);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(1);
        user.setRoleId(2L);
        when(sysUserMapper.selectById(1L)).thenReturn(user);

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("权限已变更，请重新登录"));
    }

    @Test
    void adminApi_staleTokenVersion_returns401() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        when(jwtUtils.getTokenVersion("token")).thenReturn(0);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(1);
        user.setRoleId(2L);
        user.setTokenVersion(3);
        when(sysUserMapper.selectById(1L)).thenReturn(user);

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("登录已失效，请重新登录"));
    }

    @Test
    void adminApi_mustChangePassword_blocksWriteButAllowsRead() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = activeUserWithMustChangePassword();
        user.setRoleId(2L);
        when(sysUserMapper.selectById(1L)).thenReturn(user);
        when(sysRoleMapper.selectById(2L)).thenReturn(editorRole());
        when(adminPermissionService.parsePermissions("[]")).thenReturn(java.util.Set.of());

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        adminMockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"t\",\"imageUrl\":\"u\",\"linkType\":\"none\",\"sortOrder\":1}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("请先修改密码后再操作"));
    }

    @Test
    void adminApi_mustChangePassword_allowsChangePasswordEndpoint() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = activeUserWithMustChangePassword();
        user.setRoleId(2L);
        when(sysUserMapper.selectById(1L)).thenReturn(user);
        when(sysRoleMapper.selectById(2L)).thenReturn(editorRole());
        when(adminPermissionService.parsePermissions("[]")).thenReturn(java.util.Set.of());
        when(adminAuthService.changePassword(anyLong(), anyString(), anyString()))
                .thenReturn(AdminLoginVO.builder().token("new-token").mustChangePassword(false).build());

        AdminAuthController adminAuthController = new AdminAuthController(adminAuthService);
        MockMvc authChangeMockMvc = MockMvcBuilders.standaloneSetup(adminAuthController)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(adminAuthInterceptor)
                .build();

        authChangeMockMvc.perform(put("/api/v1/admin/auth/change-password")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\":\"old\",\"newPassword\":\"NewPass123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    private static SysRole editorRole() {
        SysRole role = new SysRole();
        role.setId(2L);
        role.setRoleName("内容编辑");
        role.setPermissions("[]");
        return role;
    }

    private static SysUser activeUserWithMustChangePassword() {
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(1);
        user.setMustChangePassword(1);
        return user;
    }
}
