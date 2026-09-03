package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    @Test
    void listMine_requiresLogin() {
        MemberContext.clear();
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        BusinessException ex = assertThrows(BusinessException.class, service::listMine);
        assertEquals(401, ex.getCode());
    }

    @Test
    void detail_ownerIncludesImagesAndReply() {
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        Feedback saved = new Feedback();
        saved.setId(3L);
        saved.setMemberId(7L);
        saved.setType("使用问题");
        saved.setContent("打不开课程");
        saved.setImages("[\"https://cdn.example/a.jpg\"]");
        saved.setStatus("replied");
        saved.setReply("已处理，请重试");
        saved.setRepliedAt(LocalDateTime.of(2026, 9, 3, 12, 0));
        saved.setCreateTime(LocalDateTime.of(2026, 9, 1, 8, 0));
        when(feedbackMapper.selectById(3L)).thenReturn(saved);

        Map<String, Object> vo = service.detail(3L);

        assertEquals(3L, vo.get("id"));
        assertEquals("使用问题", vo.get("type"));
        assertEquals("打不开课程", vo.get("content"));
        assertEquals(List.of("https://cdn.example/a.jpg"), vo.get("images"));
        assertEquals("replied", vo.get("status"));
        assertEquals("已回复", vo.get("statusLabel"));
        assertEquals("已处理，请重试", vo.get("reply"));
        assertEquals("2026-09-03 12:00", vo.get("repliedAt"));
    }

    @Test
    void detail_rejectsOtherMembersFeedback() {
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        Feedback saved = new Feedback();
        saved.setId(3L);
        saved.setMemberId(99L);
        when(feedbackMapper.selectById(3L)).thenReturn(saved);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.detail(3L));
        assertEquals(404, ex.getCode());
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    void detail_missingReturnsNotFound() {
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        when(feedbackMapper.selectById(3L)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.detail(3L));
        assertEquals(404, ex.getCode());
    }

    @Test
    void listMine_mapsOwnRows() {
        FeedbackService service = new FeedbackService(feedbackMapper, new ObjectMapper());
        Feedback row = new Feedback();
        row.setId(2L);
        row.setMemberId(7L);
        row.setType("功能建议");
        row.setContent("建议");
        row.setStatus("pending");
        when(feedbackMapper.selectList(any())).thenReturn(List.of(row));

        List<Map<String, Object>> list = service.listMine();

        assertEquals(1, list.size());
        assertEquals(2L, list.get(0).get("id"));
        assertEquals("待回复", list.get(0).get("statusLabel"));
        assertEquals(List.of(), list.get(0).get("images"));
    }
}
