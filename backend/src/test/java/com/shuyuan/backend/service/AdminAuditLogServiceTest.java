package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.entity.SysLog;
import com.shuyuan.backend.mapper.SysLogMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuditLogServiceTest {

    @Mock
    private SysLogMapper sysLogMapper;
    @Mock
    private SysUserMapper sysUserMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminAuditLogService adminAuditLogService;

    @Test
    void record_insertsSysLogRow() {
        adminAuditLogService.record(1L, "修改 · news/3", "/api/v1/admin/news/3", "127.0.0.1");

        ArgumentCaptor<SysLog> captor = ArgumentCaptor.forClass(SysLog.class);
        verify(sysLogMapper).insert(captor.capture());
        SysLog row = captor.getValue();
        assertEquals(1L, row.getUserId());
        assertEquals("修改 · news/3", row.getAction());
        assertEquals("/api/v1/admin/news/3", row.getTarget());
        assertEquals("127.0.0.1", row.getIp());
    }

    @Test
    void record_skipsWhenUserIdMissing() {
        adminAuditLogService.record(null, "新增 · news", "/api/v1/admin/news", "127.0.0.1");
        verify(sysLogMapper, org.mockito.Mockito.never()).insert(any(SysLog.class));
    }

    @Test
    void list_requiresSuperPermission() {
        SysLog log = new SysLog();
        log.setId(10L);
        log.setUserId(1L);
        log.setAction("新增 · news");
        log.setTarget("/api/v1/admin/news");
        Page<SysLog> page = new Page<>(1, 20, 1);
        page.setRecords(List.of(log));
        when(sysLogMapper.selectPage(any(), any(LambdaQueryWrapper.class))).thenReturn(page);
        when(sysUserMapper.selectBatchIds(any())).thenReturn(List.of());

        var result = adminAuditLogService.list(1, 20, null, null, null, null);

        verify(adminPermissionService).require("admin:super");
        assertEquals(1, result.getTotal());
        assertEquals(1, result.getRecords().size());
        assertTrue(result.getRecords().get(0).containsKey("action"));
    }
}
