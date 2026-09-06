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
import java.util.List;
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
        LocalDateTime start = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        activity.setStartTime(start);
        activity.setQuota(0);
        activity.setEnrolledCount(0);
        when(activityMapper.selectById(1L)).thenReturn(activity);
        when(enrollService.findMemberEnroll(any(), eq(1L))).thenReturn(null);
        when(enrollService.isEnrollOpen(activity)).thenReturn(true);

        Map<String, Object> result = activityService.detail(1L);

        assertEquals(com.shuyuan.backend.util.FormatUtils.formatDateTime(start), result.get("enrollEndTime"));
        assertEquals("", result.get("enrollStartTime"));
        assertEquals(true, result.get("canEnroll"));
        assertEquals("open", result.get("enrollState"));
        assertEquals(true, result.get("enrollStartImmediately"));
    }

    @Test
    void list_usesServerEnrollStateNotJustQuota() {
        Activity open = new Activity();
        open.setId(1L);
        open.setTitle("未开始可报");
        open.setStatus("published");
        open.setStartTime(LocalDateTime.now().plusDays(1));
        open.setQuota(10);
        open.setEnrolledCount(2);

        Activity started = new Activity();
        started.setId(2L);
        started.setTitle("已经开始");
        started.setStatus("published");
        started.setStartTime(LocalDateTime.now().minusHours(1));
        started.setQuota(10);
        started.setEnrolledCount(2);

        Page<Activity> page = new Page<>(1, 20);
        page.setRecords(List.of(open, started));
        page.setTotal(2);
        when(activityMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        PageResult<Map<String, Object>> result = activityService.list(1, 20);

        assertEquals("open", result.getRecords().get(0).get("enrollState"));
        assertEquals(true, result.getRecords().get(0).get("canEnroll"));
        assertEquals("立即报名", result.getRecords().get(0).get("enrollHint"));
        assertEquals("started_no_end", result.getRecords().get(1).get("enrollState"));
        assertEquals(false, result.getRecords().get(1).get("canEnroll"));
        assertEquals("已开始", result.getRecords().get(1).get("enrollHint"));
    }

    @Test
    void list_startedWithEndTimeShowsOngoing() {
        Activity started = new Activity();
        started.setId(3L);
        started.setTitle("有结束时间");
        started.setStatus("published");
        started.setStartTime(LocalDateTime.now().minusHours(1));
        started.setEndTime(LocalDateTime.now().plusHours(2));
        started.setQuota(10);
        started.setEnrolledCount(2);

        Page<Activity> page = new Page<>(1, 20);
        page.setRecords(List.of(started));
        page.setTotal(1);
        when(activityMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        PageResult<Map<String, Object>> result = activityService.list(1, 20);

        assertEquals("started", result.getRecords().get(0).get("enrollState"));
        assertEquals("进行中", result.getRecords().get(0).get("enrollHint"));
    }
}
