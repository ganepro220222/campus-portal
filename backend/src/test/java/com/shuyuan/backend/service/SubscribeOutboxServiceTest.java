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
    private SubscribeOutboxProcessor outboxProcessor;

    private SubscribeOutboxService outboxService;
    private ShuyuanProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getSubscribe().setOutboxBatchSize(10);
        properties.getSubscribe().setOutboxStaleMinutes(5);
        outboxService = new SubscribeOutboxService(
                outboxMapper, outboxProcessor, new ObjectMapper(), properties);
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
        verifyNoInteractions(outboxProcessor);
    }

    @Test
    void pollPending_delegatesToProcessorBean() {
        SubscribeOutbox pending = pendingRow(1L);
        when(outboxMapper.resetStaleProcessing(5)).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));

        outboxService.pollPending();

        verify(outboxMapper).resetStaleProcessing(5);
        verify(outboxProcessor).processOne(1L);
    }

    @Test
    void pollPending_releasesProcessingWhenProcessorThrows() {
        SubscribeOutbox pending = pendingRow(2L);
        when(outboxMapper.resetStaleProcessing(5)).thenReturn(0);
        when(outboxMapper.selectList(any())).thenReturn(List.of(pending));
        doThrow(new RuntimeException("db timeout")).when(outboxProcessor).processOne(2L);
        when(outboxMapper.releaseProcessingToRetry(eq(2L), contains("db timeout"))).thenReturn(1);

        outboxService.pollPending();

        verify(outboxMapper).releaseProcessingToRetry(eq(2L), contains("db timeout"));
    }

    @Test
    void pollPending_callsResetStaleBeforeSelectingDueRows() {
        when(outboxMapper.resetStaleProcessing(5)).thenReturn(2);
        when(outboxMapper.selectList(any())).thenReturn(List.of());

        outboxService.pollPending();

        var inOrder = inOrder(outboxMapper, outboxProcessor);
        inOrder.verify(outboxMapper).resetStaleProcessing(5);
        inOrder.verify(outboxMapper).selectList(any());
        verifyNoInteractions(outboxProcessor);
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

    private SubscribeOutbox pendingRow(Long id) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setId(id);
        row.setMemberId(88L);
        row.setScene(SubscribeService.SCENE_ENROLL_SUCCESS);
        row.setStatus(SubscribeOutboxService.STATUS_PENDING);
        row.setNextRetryAt(LocalDateTime.now().minusSeconds(1));
        return row;
    }
}
