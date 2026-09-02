package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.dto.AnnouncementSaveRequest;
import com.shuyuan.backend.entity.Announcement;
import com.shuyuan.backend.mapper.AnnouncementMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;

@ExtendWith(MockitoExtension.class)
class AdminAnnouncementServiceTest {

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Announcement.class);
    }

    @Mock
    private AnnouncementMapper announcementMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private StringRedisTemplate redis;

    @InjectMocks
    private AdminAnnouncementService service;

    @Test
    void update_emptyStrings_clearLinkAndSchedule() {
        Announcement existing = new Announcement();
        existing.setId(1L);
        existing.setContent("通知");
        existing.setLinkUrl("/pages/old");
        existing.setStartTime(LocalDateTime.now().minusDays(2));
        existing.setEndTime(LocalDateTime.now().minusDays(1));
        existing.setStatus(1);
        when(announcementMapper.selectById(1L)).thenReturn(existing);
        AnnouncementSaveRequest req = new AnnouncementSaveRequest();
        req.setContent("通知");
        req.setLinkUrl("");
        req.setStartTime("");
        req.setEndTime("");

        var result = service.update(1L, req);

        assertEquals("", existing.getLinkUrl());
        assertNull(existing.getStartTime());
        assertNull(existing.getEndTime());
        assertTrue((Boolean) result.get("activeNow"));
        ArgumentCaptor<LambdaUpdateWrapper<Announcement>> cap = updateCaptor();
        verify(announcementMapper).update(isNull(), cap.capture());
        assertSetsColumn(cap.getValue(), "start_time", null);
        assertSetsColumn(cap.getValue(), "end_time", null);
    }
}
