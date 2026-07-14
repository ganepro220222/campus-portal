package com.shuyuan.backend.service;

import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberSubscribeRecord;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberSubscribeRecordMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscribeServiceDeliverTest {

    @Mock
    private MemberSubscribeRecordMapper subscribeRecordMapper;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private WxAccessTokenService accessTokenService;

    private SubscribeService subscribeService;

    @BeforeEach
    void setUp() {
        ShuyuanProperties properties = new ShuyuanProperties();
        properties.getWx().setDevMode(true);
        subscribeService = new SubscribeService(
                subscribeRecordMapper,
                memberMapper,
                properties,
                accessTokenService,
                new ObjectMapper());
    }

    @Test
    void deliverForScene_skipsWhenNoAuthorization() {
        when(subscribeRecordMapper.selectOne(any())).thenReturn(null);

        SubscribeSendOutcome outcome = subscribeService.deliverForScene(
                1L, SubscribeService.SCENE_ENROLL_SUCCESS, payload());

        assertEquals(SubscribeSendOutcome.SKIPPED_NO_AUTH, outcome);
        verify(subscribeRecordMapper, never()).decrAvailable(anyLong());
    }

    @Test
    void deliverForScene_skipsWhenNoOpenid() {
        MemberSubscribeRecord record = authRecord();
        when(subscribeRecordMapper.selectOne(any())).thenReturn(record);
        when(memberMapper.selectById(2L)).thenReturn(new Member());

        SubscribeSendOutcome outcome = subscribeService.deliverForScene(
                2L, SubscribeService.SCENE_ENROLL_SUCCESS, payload());

        assertEquals(SubscribeSendOutcome.SKIPPED_NO_OPENID, outcome);
        verify(subscribeRecordMapper, never()).decrAvailable(anyLong());
    }

    @Test
    void deliverForScene_sentAndDecrementsInDevMode() {
        MemberSubscribeRecord record = authRecord();
        record.setId(9L);
        Member member = new Member();
        member.setOpenid("openid_test");
        when(subscribeRecordMapper.selectOne(any())).thenReturn(record);
        when(memberMapper.selectById(3L)).thenReturn(member);

        SubscribeSendOutcome outcome = subscribeService.deliverForScene(
                3L, SubscribeService.SCENE_ENROLL_SUCCESS, payload());

        assertEquals(SubscribeSendOutcome.SENT, outcome);
        verify(subscribeRecordMapper).decrAvailable(9L);
    }

    private MemberSubscribeRecord authRecord() {
        MemberSubscribeRecord record = new MemberSubscribeRecord();
        record.setAvailableCount(1);
        record.setTemplateId("tmpl_test");
        return record;
    }

    private SubscribeOutboxPayload payload() {
        SubscribeOutboxPayload payload = new SubscribeOutboxPayload();
        payload.setActivityId(5L);
        payload.setEnrollId(11L);
        payload.setActivityTitle("讲座");
        payload.setActivityStartTime("2026-07-15 10:00");
        payload.setEnrollStatus("approved");
        payload.setVoucherCode("SY001");
        return payload;
    }
}
