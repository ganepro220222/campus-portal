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
    void listMine_requiresLogin() {
        MemberContext.clear();
        assertThrows(BusinessException.class, () -> messageService.listMine());
    }
}
