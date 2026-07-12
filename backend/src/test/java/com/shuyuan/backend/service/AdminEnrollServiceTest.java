package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.util.EnrollExportScope;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

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

    @InjectMocks
    private AdminEnrollService adminEnrollService;

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
}
