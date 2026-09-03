package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Message;
import com.shuyuan.backend.mapper.MessageMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageMapper messageMapper;

    @InjectMocks
    private MessageService messageService;

    @BeforeEach
    void setUp() {
        MemberContext.setMemberId(10L);
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    @Test
    void create_insertsMessage() {
        messageService.create(10L, "报名成功", "内容", "enroll", "activity", 1L);
        verify(messageMapper).insert(any(Message.class));
    }

    @Test
    void markRead_requiresOwner() {
        Message msg = new Message();
        msg.setId(1L);
        msg.setMemberId(99L);
        when(messageMapper.selectById(1L)).thenReturn(msg);

        assertThrows(BusinessException.class, () -> messageService.markRead(1L));
    }

    @Test
    void unreadCount_returnsZeroWhenNoMember() {
        MemberContext.clear();
        assertEquals(0, messageService.unreadCount(null));
    }

    @Test
    void listMine_feedbackMessageGetsDetailRoute() {
        Message msg = new Message();
        msg.setId(4L);
        msg.setMemberId(10L);
        msg.setTitle("意见反馈已回复");
        msg.setContent("管理员回复：已处理");
        msg.setType("system");
        msg.setRelatedType("feedback");
        msg.setRelatedId(7L);
        msg.setReadStatus(0);
        when(messageMapper.selectList(any())).thenReturn(List.of(msg));

        List<Map<String, Object>> list = messageService.listMine();

        assertEquals(1, list.size());
        assertEquals("/packageC/feedback/detail?id=7", list.get(0).get("route"));
        assertEquals("feedback", list.get(0).get("relatedType"));
        assertEquals(7L, list.get(0).get("relatedId"));
    }

    @Test
    void listMine_activityMessageKeepsActivityRoute() {
        Message msg = new Message();
        msg.setId(5L);
        msg.setMemberId(10L);
        msg.setRelatedType("activity");
        msg.setRelatedId(1L);
        msg.setReadStatus(0);
        when(messageMapper.selectList(any())).thenReturn(List.of(msg));

        assertEquals("/packageC/activity/detail?id=1", messageService.listMine().get(0).get("route"));
    }

    @Test
    void listMine_requiresLogin() {
        MemberContext.clear();
        assertThrows(BusinessException.class, () -> messageService.listMine());
    }
}
