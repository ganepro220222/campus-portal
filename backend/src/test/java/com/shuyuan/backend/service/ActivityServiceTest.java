package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.mapper.ActivityMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock private ActivityMapper activityMapper;
    @Mock private EnrollService enrollService;
    @Mock private EventLogService eventLogService;

    @InjectMocks
    private ActivityService activityService;

    @Test
    void list_normalizesInvalidPageAndCapsOversizedRequests() {
        when(activityMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PageResult<Map<String, Object>> result = activityService.list(0, 999_999);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Page<Activity>> page = ArgumentCaptor.forClass(Page.class);
        verify(activityMapper).selectPage(page.capture(), any(LambdaQueryWrapper.class));
        assertEquals(1L, page.getValue().getCurrent());
        assertEquals(100L, page.getValue().getSize());
        assertEquals(1, result.getPage());
        assertEquals(100, result.getSize());
    }

    @Test
    void detail_usesEffectiveEnrollEndAndCanEnroll() {
        Activity activity = new Activity();
        activity.setId(1L);
        activity.setTitle("讲座");
        activity.setStatus("published");
        activity.setStartTime(LocalDateTime.of(2026, 9, 10, 14, 0));
        activity.setQuota(0);
        activity.setEnrolledCount(0);
        when(activityMapper.selectById(1L)).thenReturn(activity);
        when(enrollService.findMemberEnroll(any(), eq(1L))).thenReturn(null);
        when(enrollService.isEnrollOpen(activity)).thenReturn(true);

        Map<String, Object> result = activityService.detail(1L);

        assertEquals("2026-09-10 14:00", result.get("enrollEndTime"));
        assertEquals("", result.get("enrollStartTime"));
        assertEquals(true, result.get("canEnroll"));
    }
}
