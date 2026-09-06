package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ActivitySaveRequest;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.mapper.ActivityMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminActivityServiceTest {

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Activity.class);
    }

    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private EnrollService enrollService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

    @InjectMocks
    private AdminActivityService adminActivityService;

    @Test
    void cancel_marksActivityCancelledAndCascadesEnrolls() {
        Activity activity = new Activity();
        activity.setId(3L);
        activity.setTitle("讲座");
        activity.setStatus("published");
        when(activityMapper.selectById(3L)).thenReturn(activity, activity, activity);
        when(activityMapper.casCancel(3L)).thenReturn(1);

        adminActivityService.cancel(3L);

        verify(activityMapper).casCancel(3L);
        verify(activityMapper, never()).updateById(any(Activity.class));
        verify(enrollService).onActivityCancelled(any(Activity.class));
    }

    @Test
    void publish_requiresStartTime() {
        Activity activity = new Activity();
        activity.setId(8L);
        activity.setTitle("讲座");
        activity.setStatus("draft");
        when(activityMapper.selectById(8L)).thenReturn(activity);

        assertThrows(BusinessException.class, () -> adminActivityService.publish(8L));
        verify(activityMapper, never()).updateById(any(Activity.class));
    }

    @Test
    void publish_succeedsWhenStartTimePresent() {
        Activity activity = new Activity();
        activity.setId(9L);
        activity.setTitle("讲座");
        activity.setStatus("draft");
        activity.setStartTime(LocalDateTime.of(2026, 7, 15, 10, 0));
        when(activityMapper.selectById(9L)).thenReturn(activity, activity);

        adminActivityService.publish(9L);

        verify(activityMapper).updateById(any(Activity.class));
    }

    @Test
    void cancel_rejectsAlreadyCancelled() {
        Activity activity = new Activity();
        activity.setId(3L);
        activity.setStatus("cancelled");
        when(activityMapper.selectById(3L)).thenReturn(activity);

        assertThrows(BusinessException.class,
                () -> adminActivityService.cancel(3L));
        verify(enrollService, never()).onActivityCancelled(any());
    }

    @Test
    void update_emptyStrings_clearOptionalTimes() {
        Activity existing = scheduledActivity();
        when(activityMapper.selectById(1L)).thenReturn(existing);

        ActivitySaveRequest req = new ActivitySaveRequest();
        req.setTitle("讲座");
        req.setStartTime("2026-09-10 14:00");
        req.setEndTime("");
        req.setEnrollStartTime("");
        req.setEnrollEndTime("");

        Map<String, Object> result = adminActivityService.update(1L, req);

        assertNull(existing.getEndTime());
        assertNull(existing.getEnrollStartTime());
        assertNull(existing.getEnrollEndTime());
        assertEquals("", result.get("endTime"));
        assertEquals("", result.get("enrollStartTime"));
        assertEquals("", result.get("enrollEndTime"));
        ArgumentCaptor<LambdaUpdateWrapper<Activity>> cap = updateCaptor();
        verify(activityMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "end_time", null);
        assertSetsColumn(cap.getValue(), "enroll_start_time", null);
        assertSetsColumn(cap.getValue(), "enroll_end_time", null);
    }

    @Test
    void update_rejectsEnrollEndAfterStart() {
        Activity existing = scheduledActivity();
        when(activityMapper.selectById(1L)).thenReturn(existing);

        ActivitySaveRequest req = new ActivitySaveRequest();
        req.setTitle("讲座");
        req.setStartTime("2026-09-10 14:00");
        req.setEnrollEndTime("2026-09-10 16:00");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminActivityService.update(1L, req));
        assertTrue(ex.getMessage().contains("不能晚于活动开始"));
        verify(activityMapper, never()).updateById(any(Activity.class));
        verify(activityMapper, never()).update(isNull(), any());
    }

    @Test
    void publish_rejectsEnrollEndAfterStart() {
        Activity activity = scheduledActivity();
        activity.setStatus("draft");
        activity.setEnrollEndTime(LocalDateTime.of(2026, 9, 10, 16, 0));
        when(activityMapper.selectById(1L)).thenReturn(activity);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminActivityService.publish(1L));
        assertTrue(ex.getMessage().contains("不能晚于活动开始"));
        verify(activityMapper, never()).updateById(any(Activity.class));
    }

    private static Activity scheduledActivity() {
        Activity activity = new Activity();
        activity.setId(1L);
        activity.setTitle("讲座");
        activity.setStatus("draft");
        activity.setStartTime(LocalDateTime.of(2026, 9, 10, 14, 0));
        activity.setEndTime(LocalDateTime.of(2026, 9, 10, 16, 0));
        activity.setEnrollStartTime(LocalDateTime.of(2026, 9, 1, 0, 0));
        activity.setEnrollEndTime(LocalDateTime.of(2026, 9, 9, 23, 59));
        return activity;
    }
}
