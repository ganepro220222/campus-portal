package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.Favorite;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private MemberMapper memberMapper;
    @Mock private MemberProfileMapper memberProfileMapper;
    @Mock private FavoriteMapper favoriteMapper;
    @Mock private EnrollMapper enrollMapper;
    @Mock private DownloadRecordMapper downloadRecordMapper;
    @Mock private EventLogMapper eventLogMapper;
    @Mock private BadgeMapper badgeMapper;
    @Mock private MemberBadgeMapper memberBadgeMapper;
    @Mock private NewsMapper newsMapper;
    @Mock private HallMapper hallMapper;
    @Mock private CraftMapper craftMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private ResourceMapper resourceMapper;
    @Mock private ActivityMapper activityMapper;
    @Mock private EnrollService enrollService;
    @Mock private MessageService messageService;
    @Mock private BadgeGrantService badgeGrantService;

    @InjectMocks
    private ProfileService profileService;

    @BeforeEach
    void login() {
        MemberContext.setMemberId(1L);
    }

    @AfterEach
    void clear() {
        MemberContext.clear();
    }

    @Test
    void favorites_newsTargetTypeLabelUsesDynamicCopy() {
        Favorite fav = new Favorite();
        fav.setId(10L);
        fav.setMemberId(1L);
        fav.setTargetType("news");
        fav.setTargetId(5L);
        fav.setCreateTime(LocalDateTime.of(2026, 8, 1, 12, 0));

        News news = new News();
        news.setId(5L);
        news.setTitle("书院活动通知");

        when(favoriteMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(fav));
        when(newsMapper.selectById(5L)).thenReturn(news);

        List<Map<String, Object>> list = profileService.favorites();

        assertEquals(1, list.size());
        assertEquals("动态", list.get(0).get("targetTypeLabel"));
    }
}
