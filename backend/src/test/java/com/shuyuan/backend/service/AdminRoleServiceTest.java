package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AdminRoleSaveRequest;
import com.shuyuan.backend.entity.SysRole;
import com.shuyuan.backend.mapper.SysRoleMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminRoleServiceTest {

    @Mock
    private SysRoleMapper sysRoleMapper;
    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AdminRoleService adminRoleService;

    @Test
    void create_persistsRolePermissions() {
        AdminRoleSaveRequest req = new AdminRoleSaveRequest();
        req.setRoleName("新闻审核");
        req.setPermissions(List.of("news:read", "news:publish"));

        when(sysRoleMapper.selectCount(any())).thenReturn(0L);
        doAnswer(inv -> {
            SysRole role = inv.getArgument(0);
            role.setId(5L);
            return 1;
        }).when(sysRoleMapper).insert(any(SysRole.class));

        SysRole saved = new SysRole();
        saved.setId(5L);
        saved.setRoleName("新闻审核");
        saved.setPermissions("[\"news:publish\",\"news:read\"]");
        when(sysRoleMapper.selectById(5L)).thenReturn(saved);

        var vo = adminRoleService.create(req);

        assertEquals("新闻审核", vo.get("roleName"));
        verify(sysRoleMapper).insert(any(SysRole.class));
    }

    @Test
    void delete_rejectsBuiltinSuperRole() {
        BusinessException ex = assertThrows(BusinessException.class, () -> adminRoleService.delete(1L));
        assertEquals(400, ex.getCode());
    }
}
