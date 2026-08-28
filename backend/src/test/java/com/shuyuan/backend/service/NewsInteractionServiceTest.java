package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.entity.Favorite;
import com.shuyuan.backend.entity.LikeRecord;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.FavoriteMapper;
import com.shuyuan.backend.mapper.LikeRecordMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NewsInteractionServiceTest {

    @Mock
    private NewsMapper newsMapper;
    @Mock
    private LikeRecordMapper likeRecordMapper;
    @Mock
    private FavoriteMapper favoriteMapper;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;
    @Mock
    private FavoriteService favoriteService;

    @InjectMocks
    private NewsInteractionService newsInteractionService;

    @BeforeEach
    @AfterEach
    void clearMemberContext() {
        MemberContext.clear();
    }

    @Test
    void enrichDetailInteraction_guestSeesCountsWithoutPersonalState() {
        News news = new News();
        news.setId(9L);
        news.setLikeCount(12);
        news.setFavoriteCount(3);

        Map<String, Object> detail = new HashMap<>();
        newsInteractionService.enrichDetailInteraction(detail, news);

        assertEquals(12, detail.get("likeCount"));
        assertEquals(3, detail.get("favoriteCount"));
        assertFalse((Boolean) detail.get("liked"));
        assertFalse((Boolean) detail.get("collected"));
    }

    @Test
    void enrichDetailInteraction_memberHydratesLikedAndCollected() {
        MemberContext.setMemberId(100L);

        News news = new News();
        news.setId(9L);
        news.setLikeCount(5);
        news.setFavoriteCount(null);

        when(likeRecordMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(new LikeRecord());
        when(favoriteMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        Map<String, Object> detail = new HashMap<>();
        newsInteractionService.enrichDetailInteraction(detail, news);

        assertEquals(5, detail.get("likeCount"));
        assertEquals(0, detail.get("favoriteCount"));
        assertTrue((Boolean) detail.get("liked"));
        assertFalse((Boolean) detail.get("collected"));
    }

    @Test
    void toggleLike_reLikeAfterUnlike_physicallyClearsTargetBeforeInsert() {
        MemberContext.setMemberId(100L);

        News news = new News();
        news.setId(9L);
        news.setStatus("published");
        news.setLikeCount(1);

        when(newsMapper.selectById(9L)).thenReturn(news);
        when(likeRecordMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        Map<String, Object> result = newsInteractionService.toggleLike(9L);

        assertTrue((Boolean) result.get("liked"));
        assertEquals(2, result.get("likeCount"));
        verify(likeRecordMapper).physicalDeleteByTarget(100L, "news", 9L);
        verify(likeRecordMapper).insert(any(LikeRecord.class));
    }

    @Test
    void toggleLike_unlike_physicallyDeletesActiveRow() {
        MemberContext.setMemberId(100L);

        News news = new News();
        news.setId(9L);
        news.setStatus("published");
        news.setLikeCount(3);

        LikeRecord existing = new LikeRecord();
        existing.setId(55L);

        when(newsMapper.selectById(9L)).thenReturn(news);
        when(likeRecordMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);

        Map<String, Object> result = newsInteractionService.toggleLike(9L);

        assertFalse((Boolean) result.get("liked"));
        assertEquals(2, result.get("likeCount"));
        verify(likeRecordMapper).physicalDeleteById(55L);
    }
}
