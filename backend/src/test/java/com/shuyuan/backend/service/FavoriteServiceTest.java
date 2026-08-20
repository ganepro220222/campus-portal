package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock private FavoriteMapper favoriteMapper;
    @Mock private NewsMapper newsMapper;
    @Mock private HallMapper hallMapper;
    @Mock private CraftMapper craftMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private ResourceMapper resourceMapper;
    @Mock private EventLogService eventLogService;
    @Mock private PointService pointService;

    @InjectMocks
    private FavoriteService favoriteService;

    @BeforeEach
    void login() {
        MemberContext.setMemberId(9L);
    }

    @AfterEach
    void clear() {
        MemberContext.clear();
    }

    @Test
    void toggle_hall_insertsFavorite() {
        Hall hall = new Hall();
        hall.setId(3L);
        hall.setStatus(1);
        when(hallMapper.selectById(3L)).thenReturn(hall);
        when(favoriteMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        Map<String, Object> result = favoriteService.toggle("hall", 3L);

        assertTrue((Boolean) result.get("collected"));
        assertEquals("hall", result.get("targetType"));
        verify(favoriteMapper).insert(any(Favorite.class));
        verify(pointService).awardCurrentUser("favorite");
    }

    @Test
    void enrichListCollected_marksMatchingIds() {
        Favorite fav = new Favorite();
        fav.setTargetId(2L);
        when(favoriteMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(fav));

        Map<String, Object> a = new HashMap<>();
        a.put("id", 1L);
        Map<String, Object> b = new HashMap<>();
        b.put("id", 2L);
        List<Map<String, Object>> items = List.of(a, b);

        favoriteService.enrichListCollected(items, "resource");

        assertEquals(false, items.get(0).get("collected"));
        assertEquals(true, items.get(1).get("collected"));
    }
}
