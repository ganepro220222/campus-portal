package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscribeOutboxProcessorTest {

    @Mock
    private SubscribeOutboxMapper outboxMapper;
    @Mock
    private SubscribeService subscribeService;

    private SubscribeOutboxProcessor processor;
    private ShuyuanProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getSubscribe().setOutboxMaxAttempts(3);
        properties.getSubscribe().setOutboxRetryBaseSeconds(10);
        processor = new SubscribeOutboxProcessor(
                outboxMapper, subscribeService, new ObjectMapper(), properties);
    }

    @Test
    void processOne_marksSentOnSuccess() {
        SubscribeOutbox pending = pendingRow(1L, 88L, payloadJson());
        when(outboxMapper.claimPending(1L)).thenReturn(1);
        when(outboxMapper.selectById(1L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(eq(88L), eq(SubscribeService.SCENE_ENROLL_SUCCESS), any()))
                .thenReturn(SubscribeSendOutcome.SENT);

        processor.processOne(1L);

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_SENT, cap.getValue().getStatus());
        assertNotNull(cap.getValue().getSentAt());
    }

    @Test
    void processOne_marksSkippedWhenNoAuth() {
        SubscribeOutbox pending = pendingRow(2L, 88L, payloadJson());
        when(outboxMapper.claimPending(2L)).thenReturn(1);
        when(outboxMapper.selectById(2L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(anyLong(), anyString(), any()))
                .thenReturn(SubscribeSendOutcome.SKIPPED_NO_AUTH);

        processor.processOne(2L);

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_SKIPPED, cap.getValue().getStatus());
    }

    @Test
    void processOne_schedulesRetryOnRetryableFailure() {
        SubscribeOutbox pending = pendingRow(3L, 88L, payloadJson());
        when(outboxMapper.claimPending(3L)).thenReturn(1);
        when(outboxMapper.selectById(3L)).thenReturn(claimedRow(pending));
        when(subscribeService.deliverForScene(anyLong(), anyString(), any()))
                .thenReturn(SubscribeSendOutcome.RETRYABLE_FAILURE);

        processor.processOne(3L);

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_PENDING, cap.getValue().getStatus());
        assertNotNull(cap.getValue().getNextRetryAt());
        assertTrue(cap.getValue().getNextRetryAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void processOne_marksFailedWhenAttemptsExceeded() {
        SubscribeOutbox pending = pendingRow(4L, 88L, payloadJson());
        pending.setAttemptCount(4);
        when(outboxMapper.claimPending(4L)).thenReturn(1);
        when(outboxMapper.selectById(4L)).thenReturn(claimedRow(pending));

        processor.processOne(4L);

        ArgumentCaptor<SubscribeOutbox> cap = ArgumentCaptor.forClass(SubscribeOutbox.class);
        verify(outboxMapper).updateById(cap.capture());
        assertEquals(SubscribeOutboxService.STATUS_FAILED, cap.getValue().getStatus());
        verify(subscribeService, never()).deliverForScene(anyLong(), anyString(), any());
    }

    @Test
    void processOne_skipsWhenClaimFails() {
        when(outboxMapper.claimPending(5L)).thenReturn(0);

        processor.processOne(5L);

        verify(outboxMapper, never()).updateById(any(SubscribeOutbox.class));
        verify(subscribeService, never()).deliverForScene(anyLong(), anyString(), any());
    }

    @Test
    void processOne_releasesWhenRowMissingAfterClaim() {
        when(outboxMapper.claimPending(6L)).thenReturn(1);
        when(outboxMapper.selectById(6L)).thenReturn(null);

        processor.processOne(6L);

        verify(outboxMapper).releaseProcessingToRetry(eq(6L), eq("记录不存在"));
        verify(subscribeService, never()).deliverForScene(anyLong(), anyString(), any());
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
