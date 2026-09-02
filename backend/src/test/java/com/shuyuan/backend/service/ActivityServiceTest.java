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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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
}
