package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.dto.FeedbackSubmitRequest;
import com.shuyuan.backend.entity.Feedback;
import com.shuyuan.backend.mapper.FeedbackMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackMapper feedbackMapper;

    @BeforeEach
    void login() {
        MemberContext.setMemberId(7L);
    }

    @AfterEach
    void clearContext() {
        MemberContext.clear();
    }

    @Test
    void submit_mapsLegacyEnglishOtherToCanonicalChineseValue() {
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        doAnswer(invocation -> {
            Feedback inserted = invocation.getArgument(0);
            inserted.setId(1L);
            return 1;
        }).when(feedbackMapper).insert(any(Feedback.class));
        Feedback saved = new Feedback();
        saved.setId(1L);
        saved.setMemberId(7L);
        saved.setType("其他");
        saved.setContent("建议内容");
        saved.setStatus("pending");
        when(feedbackMapper.selectById(1L)).thenReturn(saved);
        FeedbackSubmitRequest request = new FeedbackSubmitRequest();
        request.setType(" OTHER ");
        request.setContent("建议内容");

        service.submit(request);

        ArgumentCaptor<Feedback> captor = ArgumentCaptor.forClass(Feedback.class);
        verify(feedbackMapper).insert(captor.capture());
        assertEquals("其他", captor.getValue().getType());
    }
}
