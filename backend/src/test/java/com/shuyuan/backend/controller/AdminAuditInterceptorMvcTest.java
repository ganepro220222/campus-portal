package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.config.AdminAuditInterceptor;
import com.shuyuan.backend.config.AdminAuthInterceptor;
import com.shuyuan.backend.controller.admin.AdminBannerController;
import com.shuyuan.backend.dto.BannerSaveRequest;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.service.AdminAuditLogService;
import com.shuyuan.backend.service.AdminBannerService;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.ApiErrorMetrics;
import com.shuyuan.backend.util.ClientIpResolver;
import com.shuyuan.backend.util.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 管理后台审计拦截器：写操作成功须落 sys_log，且须在鉴权清理 AdminContext 之前执行。
 */
@ExtendWith(MockitoExtension.class)
class AdminAuditInterceptorMvcTest {

    private MockMvc adminMockMvc;

    @Mock
    private AdminBannerService adminBannerService;
    @Mock
    private AdminAuditLogService adminAuditLogService;
    @Mock
    private ClientIpResolver clientIpResolver;
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
        AdminAuthInterceptor adminAuthInterceptor = new AdminAuthInterceptor(
                jwtUtils, sysUserMapper, sysRoleMapper, adminPermissionService);
        AdminAuditInterceptor adminAuditInterceptor = new AdminAuditInterceptor(
                adminAuditLogService, clientIpResolver);
        AdminBannerController controller = new AdminBannerController(adminBannerService);
        adminMockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(adminAuthInterceptor, adminAuditInterceptor)
                .build();
    }

    @Test
    void postWrite_recordsAuditAfterAuth() throws Exception {
        stubActiveAdmin();
        when(clientIpResolver.resolve(any())).thenReturn("198.51.100.10");
        when(adminBannerService.create(any(BannerSaveRequest.class)))
                .thenReturn(Map.of("id", 9));

        adminMockMvc.perform(post("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"t","imageUrl":"https://cdn/x.png","linkType":"none","sortOrder":1}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        verify(adminAuditLogService).record(eq(1L), actionCaptor.capture(),
                eq("/api/v1/admin/banners"), eq("198.51.100.10"));
        assertTrue(actionCaptor.getValue().contains("banners"));
    }

    @Test
    void getRead_doesNotRecordAudit() throws Exception {
        stubActiveAdmin();
        when(adminBannerService.list(anyInt(), anyInt())).thenReturn(
                new com.shuyuan.backend.common.PageResult<>(java.util.List.of(), 0, 1, 20));

        adminMockMvc.perform(get("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(adminAuditLogService, never()).record(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void postBlockedByMustChangePassword_doesNotRecordAudit() throws Exception {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(1);
        user.setMustChangePassword(1);
        when(sysUserMapper.selectById(1L)).thenReturn(user);
        when(sysRoleMapper.selectById(2L)).thenReturn(null);
        when(adminPermissionService.parsePermissions(null)).thenReturn(java.util.Set.of());

        adminMockMvc.perform(post("/api/v1/admin/banners")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"t","imageUrl":"https://cdn/x.png","linkType":"none","sortOrder":1}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));

        verify(adminAuditLogService, never()).record(anyLong(), anyString(), anyString(), anyString());
    }

    private void stubActiveAdmin() {
        when(jwtUtils.getAdminId("token")).thenReturn(1L);
        when(jwtUtils.getAdminRoleId("token")).thenReturn(2L);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setStatus(1);
        user.setMustChangePassword(0);
        when(sysUserMapper.selectById(1L)).thenReturn(user);
        when(sysRoleMapper.selectById(2L)).thenReturn(null);
        when(adminPermissionService.parsePermissions(null)).thenReturn(java.util.Set.of());
    }
}
