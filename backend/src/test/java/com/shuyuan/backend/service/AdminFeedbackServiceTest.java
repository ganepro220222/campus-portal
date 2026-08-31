package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.dto.FeedbackReplyRequest;
import com.shuyuan.backend.entity.Feedback;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.mapper.FeedbackMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminFeedbackServiceTest {

    @Mock
    private FeedbackMapper feedbackMapper;
    @Mock
    private MemberMapper memberMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private MessageService messageService;

    private AdminFeedbackService adminFeedbackService;

    @BeforeEach
    void setUp() {
        AdminContext.set(9L, 1L, Set.of("admin:super"));
        adminFeedbackService = new AdminFeedbackService(
                feedbackMapper,
                memberMapper,
                adminPermissionService,
                messageService,
                new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        AdminContext.clear();
    }

    @Test
    void reply_savesReplyAndCreatesMemberMessage() {
        Feedback feedback = feedback(7L, 88L, "pending", null);
        Feedback saved = feedback(7L, 88L, "replied", "问题已经处理");
        Member member = new Member();
        member.setId(88L);
        member.setNickname("测试学员");

        when(feedbackMapper.selectById(7L)).thenReturn(feedback, saved);
        when(memberMapper.selectById(88L)).thenReturn(member);

        FeedbackReplyRequest request = new FeedbackReplyRequest();
        request.setReply("  问题已经处理  ");
        Map<String, Object> result = adminFeedbackService.reply(7L, request);

        assertEquals("replied", result.get("status"));
        assertEquals("问题已经处理", result.get("reply"));
        verify(feedbackMapper).updateById(feedback);
        assertEquals(9L, feedback.getRepliedBy());
        verify(messageService).create(
                88L,
                "意见反馈已回复",
                "管理员回复：问题已经处理",
                "system",
                "feedback",
                7L);
    }

    @Test
    void reply_rejectsBlankWithoutCreatingMessage() {
        FeedbackReplyRequest request = new FeedbackReplyRequest();
        request.setReply("  ");
        when(feedbackMapper.selectById(7L)).thenReturn(feedback(7L, 88L, "pending", null));

        org.junit.jupiter.api.Assertions.assertThrows(
                com.shuyuan.backend.common.exception.BusinessException.class,
                () -> adminFeedbackService.reply(7L, request));

        verifyNoInteractions(messageService);
    }

    private static Feedback feedback(Long id, Long memberId, String status, String reply) {
        Feedback feedback = new Feedback();
        feedback.setId(id);
        feedback.setMemberId(memberId);
        feedback.setType("功能建议");
        feedback.setContent("测试反馈");
        feedback.setStatus(status);
        feedback.setReply(reply);
        feedback.setCreateTime(LocalDateTime.of(2026, 8, 31, 13, 53));
        return feedback;
    }
}
