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

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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
        Activity activity = new Activity();
        activity.setId(9L);
        activity.setTitle("非遗体验");

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
        verify(messageService, times(2)).create(anyLong(), eq("活动已取消"), contains("非遗体验"),
                eq("enroll"), eq("activity"), eq(9L));
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
        verify(messageService, never()).create(anyLong(), anyString(), anyString(), anyString(), anyString(), anyLong());
    }
}
