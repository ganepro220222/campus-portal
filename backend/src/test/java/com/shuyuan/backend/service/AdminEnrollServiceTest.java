package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.util.AfterCommit;
import com.shuyuan.backend.util.EnrollExportScope;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminEnrollServiceTest {

    @Mock
    private EnrollMapper enrollMapper;
    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private MessageService messageService;
    @Mock
    private SubscribeService subscribeService;

    private AfterCommit afterCommit;
    private AdminEnrollService adminEnrollService;

    @BeforeEach
    void setUp() {
        afterCommit = new AfterCommit(Runnable::run);
        adminEnrollService = new AdminEnrollService(
                enrollMapper, activityMapper, adminPermissionService,
                messageService, subscribeService, afterCommit);
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clear();
        }
    }

    @Test
    void exportExcel_checkinScope_writesCheckinFilename() throws IOException {
        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("讲座");
        when(activityMapper.selectById(5L)).thenReturn(activity);

        Enroll approved = new Enroll();
        approved.setId(1L);
        approved.setStatus("approved");
        approved.setName("张三");
        when(enrollMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(approved));

        HttpServletResponse response = mock(HttpServletResponse.class);
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        when(response.getOutputStream()).thenReturn(new ServletOutputStream() {
            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setWriteListener(jakarta.servlet.WriteListener writeListener) {
            }

            @Override
            public void write(int b) {
                body.write(b);
            }
        });

        adminEnrollService.exportExcel(5L, EnrollExportScope.CHECKIN, response);

        ArgumentCaptor<String> headerCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).setHeader(eq("Content-Disposition"), headerCaptor.capture());
        assertTrue(headerCaptor.getValue().contains("%E7%AD%BE%E5%88%B0%E5%90%8D%E5%8D%95"));
        assertTrue(body.size() > 0);
    }

    @Test
    void approve_deferredSubscribeUntilAfterCommit() {
        stubApproveSuccess();

        TransactionSynchronizationManager.initSynchronization();
        try {
            adminEnrollService.approve(11L);
            verify(subscribeService, never()).sendEnrollApproved(anyLong(), any(), any());
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
            verify(subscribeService).sendEnrollApproved(eq(88L), any(Activity.class), any(Enroll.class));
        } finally {
            TransactionSynchronizationManager.clear();
        }
    }

    @Test
    void approve_rollbackDoesNotSendSubscribe() {
        stubApproveSuccess();

        TransactionSynchronizationManager.initSynchronization();
        try {
            adminEnrollService.approve(11L);
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
            }
            verify(subscribeService, never()).sendEnrollApproved(anyLong(), any(), any());
        } finally {
            TransactionSynchronizationManager.clear();
        }
    }

    @Test
    void approve_subscribeExceptionAfterCommitDoesNotPropagate() {
        stubApproveSuccess();
        doThrow(new RuntimeException("wx down")).when(subscribeService)
                .sendEnrollApproved(anyLong(), any(), any());

        TransactionSynchronizationManager.initSynchronization();
        try {
            assertDoesNotThrow(() -> {
                Map<String, Object> vo = adminEnrollService.approve(11L);
                assertEquals("approved", vo.get("status"));
            });
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
            verify(subscribeService).sendEnrollApproved(anyLong(), any(), any());
        } finally {
            TransactionSynchronizationManager.clear();
        }
    }

    private void stubApproveSuccess() {
        Enroll pending = new Enroll();
        pending.setId(11L);
        pending.setMemberId(88L);
        pending.setActivityId(5L);
        pending.setStatus("pending");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("讲座");

        Enroll approved = new Enroll();
        approved.setId(11L);
        approved.setMemberId(88L);
        approved.setActivityId(5L);
        approved.setStatus("approved");

        when(enrollMapper.selectById(11L)).thenReturn(pending, approved);
        when(activityMapper.selectById(5L)).thenReturn(activity);
    }
}
