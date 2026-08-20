package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Favorite;
import com.shuyuan.backend.entity.LikeRecord;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.FavoriteMapper;
import com.shuyuan.backend.mapper.LikeRecordMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NewsInteractionService {

    private final NewsMapper newsMapper;
    private final LikeRecordMapper likeRecordMapper;
    private final FavoriteMapper favoriteMapper;
    private final EventLogService eventLogService;
    private final PointService pointService;

    @Transactional
    public Map<String, Object> toggleLike(Long newsId) {
        Long memberId = requireMemberId();
        News news = requireNews(newsId);

        LikeRecord existing = likeRecordMapper.selectOne(new LambdaQueryWrapper<LikeRecord>()
                .eq(LikeRecord::getMemberId, memberId)
                .eq(LikeRecord::getTargetType, "news")
                .eq(LikeRecord::getTargetId, newsId)
                .last("LIMIT 1"));

        int likeCount = news.getLikeCount() != null ? news.getLikeCount() : 0;
        boolean liked;
        if (existing != null) {
            likeRecordMapper.deleteById(existing.getId());
            likeCount = Math.max(0, likeCount - 1);
            liked = false;
        } else {
            LikeRecord record = new LikeRecord();
            record.setMemberId(memberId);
            record.setTargetType("news");
            record.setTargetId(newsId);
            likeRecordMapper.insert(record);
            likeCount = likeCount + 1;
            liked = true;
            eventLogService.recordIfLoggedIn("like", "news", newsId);
            pointService.awardCurrentUser("like");
        }
        news.setLikeCount(likeCount);
        newsMapper.updateById(news);

        Map<String, Object> result = new HashMap<>();
        result.put("liked", liked);
        result.put("likeCount", likeCount);
        return result;
    }

    @Transactional
    public Map<String, Object> toggleFavorite(Long newsId) {
        Long memberId = requireMemberId();
        News news = requireNews(newsId);

        Favorite existing = favoriteMapper.selectOne(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId)
                .eq(Favorite::getTargetType, "news")
                .eq(Favorite::getTargetId, newsId)
                .last("LIMIT 1"));

        int favoriteCount = news.getFavoriteCount() != null ? news.getFavoriteCount() : 0;
        boolean collected;
        if (existing != null) {
            favoriteMapper.deleteById(existing.getId());
            favoriteCount = Math.max(0, favoriteCount - 1);
            collected = false;
        } else {
            Favorite record = new Favorite();
            record.setMemberId(memberId);
            record.setTargetType("news");
            record.setTargetId(newsId);
            favoriteMapper.insert(record);
            favoriteCount = favoriteCount + 1;
            collected = true;
            eventLogService.recordIfLoggedIn("favorite", "news", newsId);
            pointService.awardCurrentUser("favorite");
        }
        news.setFavoriteCount(favoriteCount);
        newsMapper.updateById(news);

        Map<String, Object> result = new HashMap<>();
        result.put("collected", collected);
        result.put("favoriteCount", favoriteCount);
        return result;
    }

    public void enrichDetailInteraction(Map<String, Object> detail, News news) {
        int likeCount = news.getLikeCount() != null ? news.getLikeCount() : 0;
        int favoriteCount = news.getFavoriteCount() != null ? news.getFavoriteCount() : 0;
        detail.put("likeCount", likeCount);
        detail.put("favoriteCount", favoriteCount);
        detail.put("likes", FormatUtils.formatCount(likeCount));

        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            detail.put("liked", false);
            detail.put("collected", false);
            return;
        }

        Long newsId = news.getId();
        LikeRecord likeRecord = likeRecordMapper.selectOne(new LambdaQueryWrapper<LikeRecord>()
                .eq(LikeRecord::getMemberId, memberId)
                .eq(LikeRecord::getTargetType, "news")
                .eq(LikeRecord::getTargetId, newsId)
                .last("LIMIT 1"));
        Favorite favorite = favoriteMapper.selectOne(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId)
                .eq(Favorite::getTargetType, "news")
                .eq(Favorite::getTargetId, newsId)
                .last("LIMIT 1"));
        detail.put("liked", likeRecord != null);
        detail.put("collected", favorite != null);
    }

    private News requireNews(Long newsId) {
        News news = newsMapper.selectById(newsId);
        if (news == null || !"published".equals(news.getStatus())) {
            throw new BusinessException(404, "资讯不存在");
        }
        return news;
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
