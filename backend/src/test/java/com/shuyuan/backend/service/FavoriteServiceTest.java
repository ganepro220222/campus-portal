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

    @Test
    void toggle_news_reFavoriteAfterUnlike_physicallyClearsTargetBeforeInsert() {
        News news = new News();
        news.setId(4L);
        news.setStatus("published");
        news.setFavoriteCount(2);
        when(newsMapper.selectById(4L)).thenReturn(news);
        when(favoriteMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        Map<String, Object> result = favoriteService.toggle("news", 4L);

        assertTrue((Boolean) result.get("collected"));
        verify(favoriteMapper).physicalDeleteByTarget(9L, "news", 4L);
        verify(favoriteMapper).insert(any(Favorite.class));
        verify(newsMapper).adjustFavoriteCount(4L, 1);
        verify(newsMapper, never()).updateById(any(News.class));
    }

    @Test
    void toggle_news_unfavorite_physicallyDeletesActiveRow() {
        News news = new News();
        news.setId(4L);
        news.setStatus("published");
        news.setFavoriteCount(3);

        Favorite existing = new Favorite();
        existing.setId(88L);

        when(newsMapper.selectById(4L)).thenReturn(news);
        when(favoriteMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);

        Map<String, Object> result = favoriteService.toggle("news", 4L);

        assertFalse((Boolean) result.get("collected"));
        verify(favoriteMapper).physicalDeleteById(88L);
        verify(newsMapper).adjustFavoriteCount(4L, -1);
        verify(newsMapper, never()).updateById(any(News.class));
    }

    @Test
    void toggle_duplicateKeyReturnsIdempotentCollectedWithoutAwarding() {
        Hall hall = new Hall();
        hall.setId(3L);
        hall.setStatus(1);
        Favorite winner = new Favorite();
        winner.setId(77L);
        when(hallMapper.selectById(3L)).thenReturn(hall);
        when(favoriteMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null, winner);
        when(favoriteMapper.insert(any(Favorite.class)))
                .thenThrow(new org.springframework.dao.DuplicateKeyException("uk_member_target"));

        Map<String, Object> result = favoriteService.toggle("hall", 3L);

        assertTrue((Boolean) result.get("collected"));
        verify(pointService, never()).awardCurrentUser("favorite");
        verify(eventLogService, never()).recordIfLoggedIn(anyString(), anyString(), anyLong());
    }
}
