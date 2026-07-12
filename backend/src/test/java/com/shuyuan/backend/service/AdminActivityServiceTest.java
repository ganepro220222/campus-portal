package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminActivityServiceTest {

    @Mock
    private ActivityMapper activityMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private EnrollService enrollService;

    @InjectMocks
    private AdminActivityService adminActivityService;

    @Test
    void cancel_marksActivityCancelledAndCascadesEnrolls() {
        Activity activity = new Activity();
        activity.setId(3L);
        activity.setTitle("讲座");
        activity.setStatus("published");
        when(activityMapper.selectById(3L)).thenReturn(activity, activity, activity);

        adminActivityService.cancel(3L);

        verify(activityMapper).updateById(any(Activity.class));
        verify(enrollService).onActivityCancelled(any(Activity.class));
    }

    @Test
    void cancel_rejectsAlreadyCancelled() {
        Activity activity = new Activity();
        activity.setId(3L);
        activity.setStatus("cancelled");
        when(activityMapper.selectById(3L)).thenReturn(activity);

        assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> adminActivityService.cancel(3L));
        verify(enrollService, never()).onActivityCancelled(any());
    }
}
