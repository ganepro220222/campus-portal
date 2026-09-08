package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollServiceActivityCancelTest {

    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private EnrollMapper enrollMapper;
    @Mock
    private MessageService messageService;

    @InjectMocks
    private EnrollService enrollService;

    @Test
    void onActivityCancelled_cancelsActiveEnrollsAndReleasesQuota() {
        Activity activity = cancelledActivity();

        Enroll pending = new Enroll();
        pending.setId(1L);
        pending.setMemberId(10L);
        pending.setActivityId(9L);
        pending.setStatus("pending");

        Enroll approved = new Enroll();
        approved.setId(2L);
        approved.setMemberId(11L);
        approved.setActivityId(9L);
        approved.setStatus("approved");

        when(enrollMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(pending, approved));
        when(enrollMapper.casCancelActive(anyLong())).thenReturn(1);

        enrollService.onActivityCancelled(activity);

        verify(enrollMapper, times(2)).casCancelActive(anyLong());
        verify(enrollMapper, never()).updateById(any(Enroll.class));
        verify(activityMapper, times(2)).decrEnrolledCount(9L);
        ArgumentCaptor<String> contentCap = ArgumentCaptor.forClass(String.class);
        verify(messageService, times(2)).create(anyLong(), eq(MessageService.TITLE_ACTIVITY_CANCELLED),
                contentCap.capture(), eq("enroll"), isNull(), isNull());
        String content = contentCap.getValue();
        assertTrue(content.contains("非遗体验"));
        assertTrue(content.contains("2026-09-10 14:00"));
        assertTrue(content.contains("体验中心"));
        assertEquals("", MessageService.buildRoute(
                MessageService.TITLE_ACTIVITY_CANCELLED, null, null));
    }

    @Test
    void onActivityCancelled_skipsAlreadyCancelledRow() {
        Activity activity = new Activity();
        activity.setId(9L);
        activity.setTitle("非遗体验");

        Enroll pending = new Enroll();
        pending.setId(1L);
        pending.setMemberId(10L);
        pending.setActivityId(9L);
        pending.setStatus("pending");

        when(enrollMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(pending));
        when(enrollMapper.casCancelActive(1L)).thenReturn(0);

        enrollService.onActivityCancelled(activity);

        verify(activityMapper, never()).decrEnrolledCount(anyLong());
        verifyNoInteractions(messageService);
    }

    @Test
    void buildActivityCancelledNotice_includesScheduleWhenPresent() {
        Activity activity = cancelledActivity();
        String notice = EnrollService.buildActivityCancelledNotice(activity);
        assertTrue(notice.contains("您报名的活动「非遗体验」已取消，报名同步关闭。"));
        assertTrue(notice.contains("原定时间：2026-09-10 14:00"));
        assertTrue(notice.contains("地点：体验中心"));
        assertFalse(notice.contains("/packageC/activity/detail"));
    }

    @Test
    void buildActivityCancelledNotice_skipsBlankSchedule() {
        Activity activity = new Activity();
        activity.setTitle("讲座");
        String notice = EnrollService.buildActivityCancelledNotice(activity);
        assertEquals("您报名的活动「讲座」已取消，报名同步关闭。", notice);
        assertFalse(notice.contains("原定时间"));
        assertFalse(notice.contains("地点"));
    }

    private static Activity cancelledActivity() {
        Activity activity = new Activity();
        activity.setId(9L);
        activity.setTitle("非遗体验");
        activity.setLocation("体验中心");
        activity.setStartTime(LocalDateTime.of(2026, 9, 10, 14, 0));
        activity.setStatus("cancelled");
        return activity;
    }
}
