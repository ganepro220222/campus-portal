package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminUserSaveRequest;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private SysRoleMapper sysRoleMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminUserService adminUserService;

    @AfterEach
    void clearContext() {
        AdminContext.clear();
    }

    @Test
    void create_setsMustChangePasswordAndReturnsTemporaryPassword() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("teacher_li");
        req.setRoleId(2L);
        req.setRealName("李老师");

        when(sysUserMapper.selectCount(any())).thenReturn(0L);
        SysRole role = new SysRole();
        role.setId(2L);
        role.setRoleName("内容编辑");
        when(sysRoleMapper.selectById(2L)).thenReturn(role);
        doAnswer(inv -> {
            SysUser user = inv.getArgument(0);
            user.setId(8L);
            return 1;
        }).when(sysUserMapper).insert(any(SysUser.class));

        SysUser saved = new SysUser();
        saved.setId(8L);
        saved.setUsername("teacher_li");
        saved.setRealName("李老师");
        saved.setRoleId(2L);
        saved.setStatus(1);
        saved.setMustChangePassword(1);
        when(sysUserMapper.selectById(8L)).thenReturn(saved);

        var vo = adminUserService.create(req);

        assertEquals("teacher_li", vo.get("username"));
        assertNotNull(vo.get("temporaryPassword"));
        verify(sysUserMapper).insert(any(SysUser.class));
    }

    @Test
    void delete_rejectsSelf() {
        AdminContext.set(3L, 1L, java.util.Set.of("admin:super"));
        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.delete(3L));
        assertEquals(400, ex.getCode());
    }
}
