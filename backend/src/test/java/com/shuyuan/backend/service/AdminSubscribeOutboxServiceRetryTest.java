package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSubscribeOutboxServiceRetryTest {

    @Mock
    SubscribeOutboxMapper outboxMapper;
    @Mock
    ActivityMapper activityMapper;
    @Mock
    EnrollMapper enrollMapper;
    @Mock
    MemberProfileMapper memberProfileMapper;
    @Mock
    MemberAccountMapper memberAccountMapper;
    @Mock
    AdminPermissionService adminPermissionService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AdminSubscribeOutboxService service;

    @BeforeEach
    void setUp() {
        service = new AdminSubscribeOutboxService(
                outboxMapper, activityMapper, enrollMapper,
                memberProfileMapper, memberAccountMapper, adminPermissionService, objectMapper);
    }

    @Test
    void retry_刷新活动开始时间并写回payload() throws Exception {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(9L);
        row.setStatus(SubscribeOutboxService.STATUS_SKIPPED);
        row.setPayloadJson(objectMapper.writeValueAsString(payloadWithStaleTime()));

        Activity activity = new Activity();
        activity.setId(12L);
        activity.setTitle("非遗研学讲座");
        activity.setStartTime(LocalDateTime.of(2026, 9, 1, 14, 0));

        Enroll enroll = new Enroll();
        enroll.setId(34L);
        enroll.setStatus("approved");
        enroll.setVoucherCode("V001");

        when(outboxMapper.selectById(9L)).thenReturn(row);
        when(activityMapper.selectById(12L)).thenReturn(activity);
        when(enrollMapper.selectById(34L)).thenReturn(enroll);
        when(outboxMapper.requeueForRetry(eq(9L), org.mockito.ArgumentMatchers.anyString())).thenReturn(1);

        service.retry(9L);

        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(outboxMapper).requeueForRetry(eq(9L), payloadCaptor.capture());
        SubscribeOutboxPayload refreshed = objectMapper.readValue(payloadCaptor.getValue(), SubscribeOutboxPayload.class);
        assertEquals("非遗研学讲座", refreshed.getActivityTitle());
        assertEquals("2026-09-01 14:00", refreshed.getActivityStartTime());
        assertEquals("approved", refreshed.getEnrollStatus());
        assertEquals("V001", refreshed.getVoucherCode());
    }

    @Test
    void retry_活动不存在时拒绝() throws Exception {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(1L);
        row.setStatus(SubscribeOutboxService.STATUS_FAILED);
        row.setPayloadJson("{\"activityId\":99}");

        when(outboxMapper.selectById(1L)).thenReturn(row);
        when(activityMapper.selectById(99L)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.retry(1L));
        assertEquals(400, ex.getCode());
        verify(outboxMapper, never()).requeueForRetry(anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void retry_不可重试时拒绝() throws Exception {
        SubscribeOutbox noAuth = new SubscribeOutbox();
        noAuth.setId(3L);
        noAuth.setStatus(SubscribeOutboxService.STATUS_SKIPPED);
        noAuth.setLastError("SKIPPED_NO_AUTH");
        noAuth.setPayloadJson("{}");

        when(outboxMapper.selectById(3L)).thenReturn(noAuth);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.retry(3L));
        assertEquals(400, ex.getCode());
        verify(outboxMapper, never()).requeueForRetry(anyLong(), org.mockito.ArgumentMatchers.anyString());

        SubscribeOutbox badPayload = new SubscribeOutbox();
        badPayload.setId(4L);
        badPayload.setStatus(SubscribeOutboxService.STATUS_FAILED);
        badPayload.setLastError("payload 解析失败");
        badPayload.setPayloadJson("{}");

        when(outboxMapper.selectById(4L)).thenReturn(badPayload);

        ex = assertThrows(BusinessException.class, () -> service.retry(4L));
        assertEquals(400, ex.getCode());
        verify(outboxMapper, never()).requeueForRetry(eq(4L), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void retry_非终态不可重试() {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(2L);
        row.setStatus(SubscribeOutboxService.STATUS_PENDING);
        row.setPayloadJson("{}");

        when(outboxMapper.selectById(2L)).thenReturn(row);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.retry(2L));
        assertEquals(400, ex.getCode());
        verify(outboxMapper, never()).requeueForRetry(anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    private static SubscribeOutboxPayload payloadWithStaleTime() {
        SubscribeOutboxPayload p = new SubscribeOutboxPayload();
        p.setActivityId(12L);
        p.setEnrollId(34L);
        p.setActivityTitle("旧标题");
        p.setActivityStartTime("");
        return p;
    }
}
