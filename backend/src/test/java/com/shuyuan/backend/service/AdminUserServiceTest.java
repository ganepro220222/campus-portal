package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminUserSaveRequest;
import com.shuyuan.backend.dto.AdminUsernameOccupancy;
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
import org.springframework.dao.DuplicateKeyException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

        when(sysUserMapper.findUsernameOccupancy("teacher_li")).thenReturn(null);
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
    void create_rejectsActiveUsernameDuplicate() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("zhangsan");
        req.setRoleId(2L);

        AdminUsernameOccupancy active = new AdminUsernameOccupancy();
        active.setId(3L);
        active.setIsDeleted(0);
        when(sysUserMapper.findUsernameOccupancy("zhangsan")).thenReturn(active);
        when(sysRoleMapper.selectById(2L)).thenReturn(role(2L));

        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.create(req));
        assertEquals(409, ex.getCode());
        assertEquals("登录账号已存在", ex.getMessage());
        verify(sysUserMapper, never()).insert(any(SysUser.class));
    }

    @Test
    void create_rejectsRecycleBinUsername() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("zhangsan");
        req.setRoleId(2L);

        AdminUsernameOccupancy recycled = new AdminUsernameOccupancy();
        recycled.setId(9L);
        recycled.setIsDeleted(1);
        when(sysUserMapper.findUsernameOccupancy("zhangsan")).thenReturn(recycled);
        when(sysRoleMapper.selectById(2L)).thenReturn(role(2L));

        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.create(req));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("回收站"));
        verify(sysUserMapper, never()).insert(any(SysUser.class));
    }

    @Test
    void create_duplicateKeyFallback_returns409() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("zhangsan");
        req.setRoleId(2L);
        when(sysUserMapper.findUsernameOccupancy("zhangsan")).thenReturn(null);
        when(sysRoleMapper.selectById(2L)).thenReturn(role(2L));
        doThrow(new DuplicateKeyException("uk_username")).when(sysUserMapper).insert(any(SysUser.class));

        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.create(req));
        assertEquals(409, ex.getCode());
        assertEquals("登录账号已存在，请更换后重试", ex.getMessage());
    }

    @Test
    void update_allowsKeepingOwnUsername() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("teacher_li");

        SysUser existing = new SysUser();
        existing.setId(8L);
        existing.setUsername("teacher_li");
        existing.setRoleId(2L);
        existing.setStatus(1);

        AdminUsernameOccupancy self = new AdminUsernameOccupancy();
        self.setId(8L);
        self.setIsDeleted(0);
        when(sysUserMapper.selectById(8L)).thenReturn(existing);
        when(sysUserMapper.findUsernameOccupancy("teacher_li")).thenReturn(self);
        when(sysRoleMapper.selectById(2L)).thenReturn(role(2L));
        when(sysUserMapper.selectById(8L)).thenReturn(existing);

        adminUserService.update(8L, req);

        verify(sysUserMapper).updateById(existing);
    }

    @Test
    void update_rejectsRecycleBinUsername() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("lisi");

        SysUser existing = new SysUser();
        existing.setId(8L);
        existing.setUsername("teacher_li");
        existing.setRoleId(2L);
        existing.setStatus(1);

        AdminUsernameOccupancy recycled = new AdminUsernameOccupancy();
        recycled.setId(12L);
        recycled.setIsDeleted(1);
        when(sysUserMapper.selectById(8L)).thenReturn(existing);
        when(sysUserMapper.findUsernameOccupancy("lisi")).thenReturn(recycled);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.update(8L, req));
        assertEquals(409, ex.getCode());
        assertTrue(ex.getMessage().contains("回收站"));
        verify(sysUserMapper, never()).updateById(any(SysUser.class));
    }

    @Test
    void update_duplicateKeyFallback_returns409() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("new_name");

        SysUser existing = new SysUser();
        existing.setId(8L);
        existing.setUsername("teacher_li");
        existing.setRoleId(2L);
        existing.setStatus(1);

        when(sysUserMapper.selectById(8L)).thenReturn(existing);
        when(sysUserMapper.findUsernameOccupancy("new_name")).thenReturn(null);
        doThrow(new DuplicateKeyException("uk_username")).when(sysUserMapper).updateById(any(SysUser.class));

        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.update(8L, req));
        assertEquals(409, ex.getCode());
        assertEquals("登录账号已存在，请更换后重试", ex.getMessage());
    }

    @Test
    void delete_rejectsSelf() {
        AdminContext.set(3L, 1L, java.util.Set.of("admin:super"));
        BusinessException ex = assertThrows(BusinessException.class, () -> adminUserService.delete(3L));
        assertEquals(400, ex.getCode());
    }

    private static SysRole role(long id) {
        SysRole role = new SysRole();
        role.setId(id);
        role.setRoleName("test-role");
        return role;
    }
}
