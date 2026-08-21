package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ProfileUpdateRequest;
import com.shuyuan.backend.entity.Favorite;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.*;
import com.shuyuan.backend.vo.MemberVO;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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

    @Test
    void updateProfile_insertsMemberProfileWhenMissing() {
        Member member = new Member();
        member.setId(1L);
        member.setNickname("旧昵称");
        member.setPoints(10);

        Member reloaded = new Member();
        reloaded.setId(1L);
        reloaded.setNickname("新昵称");
        reloaded.setPoints(10);

        when(memberMapper.selectById(1L)).thenReturn(member, reloaded);
        when(memberProfileMapper.selectById(1L)).thenReturn(null);

        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setNickname("新昵称");
        req.setRealName("张三");
        req.setPhone("13800138000");
        req.setCollege("交通学院");
        req.setGrade("2024 级");

        MemberVO vo = profileService.updateProfile(req);

        verify(memberProfileMapper).insert(any(MemberProfile.class));
        assertEquals("新昵称", vo.getNickname());
        assertEquals("张三", vo.getRealName());
        assertEquals("13800138000", vo.getPhone());
        assertEquals("2024 级", vo.getGrade());
    }

    @Test
    void updateProfile_rejectsInvalidPhone() {
        Member member = new Member();
        member.setId(1L);
        when(memberMapper.selectById(1L)).thenReturn(member);

        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setRealName("张三");
        req.setPhone("12345");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> profileService.updateProfile(req));
        assertEquals(400, ex.getCode());
    }
}
