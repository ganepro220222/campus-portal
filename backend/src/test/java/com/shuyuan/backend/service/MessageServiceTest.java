package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Message;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.MessageMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Message.class);
    }

    @Mock
    private MessageMapper messageMapper;
    @Mock
    private ActivityMapper activityMapper;

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
        Message msg = enrollNotice("报名成功", 1L);
        when(messageMapper.selectList(any())).thenReturn(List.of(msg));
        when(activityMapper.selectList(any())).thenReturn(List.of(publishedActivity(1L)));

        assertEquals("/packageC/activity/detail?id=1", messageService.listMine().get(0).get("route"));
    }

    @Test
    void listMine_onlyPublishedActivityKeepsRoute() {
        Message submitted = enrollNotice("报名已提交", 9L);
        submitted.setId(1L);
        Message approved = enrollNotice("报名审核通过", 9L);
        approved.setId(2L);
        Message rejected = enrollNotice("报名未通过", 9L);
        rejected.setId(3L);
        Message other = enrollNotice("报名成功", 2L);
        other.setId(4L);
        when(messageMapper.selectList(any())).thenReturn(List.of(submitted, approved, rejected, other));
        when(activityMapper.selectList(any())).thenReturn(List.of(publishedActivity(2L)));

        List<Map<String, Object>> list = messageService.listMine();
        assertEquals("", list.get(0).get("route"));
        assertEquals("", list.get(1).get("route"));
        assertEquals("", list.get(2).get("route"));
        assertEquals("/packageC/activity/detail?id=2", list.get(3).get("route"));
    }

    @Test
    void listMine_successNoticeHasNoRouteWhenActivityCancelled() {
        Message msg = enrollNotice("报名成功", 9L);
        when(messageMapper.selectList(any())).thenReturn(List.of(msg));
        when(activityMapper.selectList(any())).thenReturn(List.of());

        assertEquals("", messageService.listMine().get(0).get("route"));
        assertEquals("", MessageService.buildRoute("报名成功", "activity", 9L, Set.of()));
        assertEquals("/packageC/activity/detail?id=9",
                MessageService.buildRoute("报名成功", "activity", 9L, Set.of(9L)));
    }

    @Test
    void listMine_cancelledActivityNoticeHasNoRoute() {
        Message legacy = new Message();
        legacy.setId(6L);
        legacy.setMemberId(10L);
        legacy.setTitle(MessageService.TITLE_ACTIVITY_CANCELLED);
        legacy.setContent("您报名的活动「非遗体验」已取消，报名同步关闭。");
        legacy.setRelatedType("activity");
        legacy.setRelatedId(9L);
        legacy.setReadStatus(0);
        when(messageMapper.selectList(any())).thenReturn(List.of(legacy));

        assertEquals("", messageService.listMine().get(0).get("route"));
        assertEquals("", MessageService.buildRoute(
                MessageService.TITLE_ACTIVITY_CANCELLED, "activity", 9L));
        assertEquals("", MessageService.buildRoute(
                MessageService.TITLE_ACTIVITY_CANCELLED, null, null));
    }

    @Test
    void listMine_requiresLogin() {
        MemberContext.clear();
        assertThrows(BusinessException.class, () -> messageService.listMine());
    }

    @Test
    void clearActivityRoutes_clearsRelatedFields() {
        messageService.clearActivityRoutes(9L);

        ArgumentCaptor<LambdaUpdateWrapper<Message>> cap = updateCaptor();
        verify(messageMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "related_type", null);
        assertSetsColumn(cap.getValue(), "related_id", null);
        String where = cap.getValue().getSqlSegment();
        assertTrue(where.contains("related_type"), where);
        assertTrue(where.contains("related_id"), where);
        assertTrue(cap.getValue().getParamNameValuePairs().containsValue("activity"));
        assertTrue(cap.getValue().getParamNameValuePairs().containsValue(9L));
    }

    @Test
    void clearActivityRoutes_skipsNullActivity() {
        assertEquals(0, messageService.clearActivityRoutes(null));
        verify(messageMapper, never()).update(any(), any());
    }

    private static Message enrollNotice(String title, Long activityId) {
        Message msg = new Message();
        msg.setId(5L);
        msg.setMemberId(10L);
        msg.setTitle(title);
        msg.setRelatedType("activity");
        msg.setRelatedId(activityId);
        msg.setReadStatus(0);
        return msg;
    }

    private static Activity publishedActivity(Long id) {
        Activity activity = new Activity();
        activity.setId(id);
        activity.setStatus("published");
        return activity;
    }
}
