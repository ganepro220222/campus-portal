package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.EventLog;
import com.shuyuan.backend.mapper.EventLogMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EventLogServiceTest {

    @Mock
    private EventLogMapper eventLogMapper;

    @InjectMocks
    private EventLogService eventLogService;

    @AfterEach
    void tearDown() {
        com.shuyuan.backend.common.context.MemberContext.clear();
    }

    @Test
    void record_persistsEventWithMemberId() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(12L);

        eventLogService.record("view", "news", 5L);

        ArgumentCaptor<EventLog> captor = ArgumentCaptor.forClass(EventLog.class);
        verify(eventLogMapper).insert(captor.capture());
        EventLog log = captor.getValue();
        assertEquals(12L, log.getMemberId());
        assertEquals("view", log.getEventType());
        assertEquals("news", log.getTargetType());
        assertEquals(5L, log.getTargetId());
    }

    @Test
    void record_allowsAnonymousPv() {
        eventLogService.record("view", "hall", 2L);

        ArgumentCaptor<EventLog> captor = ArgumentCaptor.forClass(EventLog.class);
        verify(eventLogMapper).insert(captor.capture());
        assertNull(captor.getValue().getMemberId());
    }

    @Test
    void record_skipsBlankEventType() {
        eventLogService.record("  ", "news", 1L);
        verify(eventLogMapper, never()).insert(any(EventLog.class));
    }

    @Test
    void recordIfLoggedIn_skipsGuest() {
        eventLogService.recordIfLoggedIn("favorite", "news", 1L);
        verify(eventLogMapper, never()).insert(any(EventLog.class));
    }

    @Test
    void recordIfLoggedIn_writesForLoggedInUser() {
        com.shuyuan.backend.common.context.MemberContext.setMemberId(7L);

        eventLogService.recordIfLoggedIn("download", "resource", 9L);

        ArgumentCaptor<EventLog> captor = ArgumentCaptor.forClass(EventLog.class);
        verify(eventLogMapper).insert(captor.capture());
        assertEquals("download", captor.getValue().getEventType());
        assertEquals(7L, captor.getValue().getMemberId());
    }
}
