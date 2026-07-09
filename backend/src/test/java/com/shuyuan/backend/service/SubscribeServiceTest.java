package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeRecordRequest;
import com.shuyuan.backend.entity.MemberSubscribeRecord;
import com.shuyuan.backend.mapper.MemberSubscribeRecordMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscribeServiceTest {

    @Mock
    private MemberSubscribeRecordMapper subscribeRecordMapper;
    @Mock
    private com.shuyuan.backend.mapper.MemberMapper memberMapper;
    @Mock
    private ShuyuanProperties properties;
    @Mock
    private WxAccessTokenService accessTokenService;
    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @InjectMocks
    private SubscribeService subscribeService;

    @Test
    void recordAuthorization_insertsWhenAccepted() {
        when(subscribeRecordMapper.selectOne(any())).thenReturn(null);
        SubscribeRecordRequest req = new SubscribeRecordRequest();
        req.setScene(SubscribeService.SCENE_ENROLL_SUCCESS);
        req.setTemplateId("tmpl_test");
        req.setAccepted(true);

        subscribeService.recordAuthorization(1L, req);

        verify(subscribeRecordMapper).insert(any(MemberSubscribeRecord.class));
    }

    @Test
    void recordAuthorization_skipsWhenRejected() {
        SubscribeRecordRequest req = new SubscribeRecordRequest();
        req.setScene(SubscribeService.SCENE_ENROLL_SUCCESS);
        req.setTemplateId("tmpl_test");
        req.setAccepted(false);

        subscribeService.recordAuthorization(1L, req);

        verify(subscribeRecordMapper, never()).insert(any(MemberSubscribeRecord.class));
        verify(subscribeRecordMapper, never()).updateById(any(MemberSubscribeRecord.class));
    }

    @Test
    void recordAuthorization_incrementsExisting() {
        MemberSubscribeRecord existing = new MemberSubscribeRecord();
        existing.setId(9L);
        existing.setAvailableCount(1);
        when(subscribeRecordMapper.selectOne(any())).thenReturn(existing);

        SubscribeRecordRequest req = new SubscribeRecordRequest();
        req.setScene(SubscribeService.SCENE_ENROLL_SUCCESS);
        req.setTemplateId("tmpl_test");
        req.setAccepted(true);

        subscribeService.recordAuthorization(2L, req);

        ArgumentCaptor<MemberSubscribeRecord> cap = ArgumentCaptor.forClass(MemberSubscribeRecord.class);
        verify(subscribeRecordMapper).updateById(cap.capture());
        assertEquals(2, cap.getValue().getAvailableCount());
    }
}
