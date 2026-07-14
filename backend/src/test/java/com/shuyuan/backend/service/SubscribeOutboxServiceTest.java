package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscribeOutboxServiceTest {

    @Mock
    private SubscribeOutboxMapper outboxMapper;
    @Mock
    private SubscribeService subscribeService;

    private SubscribeOutboxService outboxService;
    private ShuyuanProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getSubscribe().setOutboxMaxAttempts(3);
        properties.getSubscribe().setOutboxRetryBaseSeconds(10);
        properties.getSubscribe().setOutboxStaleMinutes(5);
        properties.getSubscribe().setOutboxBatchSize(10);
        outboxService = new SubscribeOutboxService(
                outboxMapper, subscribeService, new ObjectMapper(), properties);
    }

    @Test
    void enqueueEnrollSuccess_insertsPendingRow() {
        Activity activity = activity(5L, "讲座");
        Enroll enroll = enroll(11L, "approved", "SY001");

        outboxService.enqueueEnrollSuccess(88L, activity, enroll);

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).insert(cap.capture());
        SubscribeOutbox row = cap.getValue();
        assertEquals(88L, row.getMemberId());
        assertEquals(SubscribeService.SCENE_ENROLL_SUCCESS, row.getScene());
        assertEquals(SubscribeOutboxService.STATUS_PENDING, row.getStatus());
        assertNotNull(row.getPayloadJson());
        assertTrue(row.getPayloadJson().contains("\"activityId\":5"));
        verifyNoInteractions(subscribeService);
    }

    @Test
    void pollPending_marksSentOnSuccess() {
        SubscribeOutbox pending = pendingRow(1L, 88L, payloadJson());
        when(outboxMapper.resetStaleProcessing(anyInt())).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        when(outboxMapper.claimPending(1L)).thenReturn(1);
        when(outboxMapper.selectById(1L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(eq(88L), eq(SubscribeService.SCENE_ENROLL_SUCCESS), any()))
                .thenReturn(SubscribeSendOutcome.SENT);

        outboxService.pollPending();

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_SENT, cap.getValue().getStatus());
        assertNotNull(cap.getValue().getSentAt());
    }

    @Test
    void pollPending_marksSkippedWhenNoAuth() {
        SubscribeOutbox pending = pendingRow(2L, 88L, payloadJson());
        when(outboxMapper.resetStaleProcessing(anyInt())).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        when(outboxMapper.claimPending(2L)).thenReturn(1);
        when(outboxMapper.selectById(2L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(anyLong(), anyString(), any()))
                .thenReturn(SubscribeSendOutcome.SKIPPED_NO_AUTH);

        outboxService.pollPending();

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_SKIPPED, cap.getValue().getStatus());
    }

    @Test
    void pollPending_schedulesRetryOnRetryableFailure() {
        SubscribeOutbox pending = pendingRow(3L, 88L, payloadJson());
        when(outboxMapper.resetStaleProcessing(anyInt())).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        when(outboxMapper.claimPending(3L)).thenReturn(1);
        when(outboxMapper.selectById(3L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(anyLong(), anyString(), any()))
                .thenReturn(SubscribeSendOutcome.RETRYABLE_FAILURE);

        outboxService.pollPending();

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_PENDING, cap.getValue().getStatus());
        assertNotNull(cap.getValue().getNextRetryAt());
        assertTrue(cap.getValue().getNextRetryAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void pollPending_marksFailedWhenAttemptsExceeded() {
        SubscribeOutbox pending = pendingRow(4L, 88L, payloadJson());
        pending.setAttemptCount(4);
        when(outboxMapper.resetStaleProcessing(anyInt())).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        when(outboxMapper.claimPending(4L)).thenReturn(1);
        when(outboxMapper.selectById(4L)).thenReturn(claimedRow(pending));

        outboxService.pollPending();

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_FAILED, cap.getValue().getStatus());
        verify(subscribeService, never()).deliverForScene(anyLong(), anyString(), any());
    }

    @Test
    void pollPending_skipsWhenClaimFails() {
        SubscribeOutbox pending = pendingRow(5L, 88L, payloadJson());
        when(outboxMapper.resetStaleProcessing(anyInt())).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        when(outboxMapper.claimPending(5L)).thenReturn(0);

        outboxService.pollPending();

        verify(outboxMapper, never()).updateById(any(SubscribeOutbox.class));
        verify(subscribeService, never()).deliverForScene(anyLong(), anyString(), any());
    }

    private Activity activity(Long id, String title) {
        Activity activity = new Activity();
        activity.setId(id);
        activity.setTitle(title);
        activity.setStartTime(LocalDateTime.of(2026, 7, 15, 10, 0));
        return activity;
    }

    private Enroll enroll(Long id, String status, String voucher) {
        Enroll enroll = new Enroll();
        enroll.setId(id);
        enroll.setStatus(status);
        enroll.setVoucherCode(voucher);
        return enroll;
    }

    private SubscribeOutbox pendingRow(Long id, Long memberId, String payloadJson) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(id);
        row.setMemberId(memberId);
        row.setScene(SubscribeService.SCENE_ENROLL_SUCCESS);
        row.setPayloadJson(payloadJson);
        row.setStatus(SubscribeOutboxService.STATUS_PENDING);
        row.setAttemptCount(0);
        row.setNextRetryAt(LocalDateTime.now().minusSeconds(1));
        return row;
    }

    private SubscribeOutbox claimedRow(SubscribeOutbox base) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(base.getId());
        row.setMemberId(base.getMemberId());
        row.setScene(base.getScene());
        row.setPayloadJson(base.getPayloadJson());
        row.setStatus(SubscribeOutboxService.STATUS_PROCESSING);
        row.setAttemptCount(base.getAttemptCount() != null ? base.getAttemptCount() + 1 : 1);
        return row;
    }

    private String payloadJson() {
        SubscribeOutboxPayload payload = new SubscribeOutboxPayload();
        payload.setActivityId(5L);
        payload.setEnrollId(11L);
        payload.setActivityTitle("讲座");
        payload.setActivityStartTime("2026-07-15 10:00");
        payload.setEnrollStatus("approved");
        payload.setVoucherCode("SY001");
        try {
            return new ObjectMapper().writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
