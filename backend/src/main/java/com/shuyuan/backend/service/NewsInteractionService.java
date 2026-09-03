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
import org.springframework.dao.DuplicateKeyException;
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
    private final FavoriteService favoriteService;

    @Transactional
    public Map<String, Object> toggleLike(Long newsId) {
        Long memberId = requireMemberId();
        requireNews(newsId);

        LikeRecord existing = likeRecordMapper.selectOne(new LambdaQueryWrapper<LikeRecord>()
                .eq(LikeRecord::getMemberId, memberId)
                .eq(LikeRecord::getTargetType, "news")
                .eq(LikeRecord::getTargetId, newsId)
                .last("LIMIT 1"));

        boolean liked;
        if (existing != null) {
            int affected = likeRecordMapper.physicalDeleteByIdAndMember(existing.getId(), memberId);
            if (affected > 0) {
                newsMapper.adjustLikeCount(newsId, -1);
            }
            liked = false;
        } else {
            // 清掉历史软删残留，避免 uk_member_target 冲突导致 500
            likeRecordMapper.physicalDeleteByTarget(memberId, "news", newsId);
            try {
                LikeRecord record = new LikeRecord();
                record.setMemberId(memberId);
                record.setTargetType("news");
                record.setTargetId(newsId);
                likeRecordMapper.insert(record);
                newsMapper.adjustLikeCount(newsId, 1);
                liked = true;
                eventLogService.recordIfLoggedIn("like", "news", newsId);
                pointService.awardCurrentUser("like");
            } catch (DuplicateKeyException ex) {
                liked = likeRecordMapper.selectOne(new LambdaQueryWrapper<LikeRecord>()
                        .eq(LikeRecord::getMemberId, memberId)
                        .eq(LikeRecord::getTargetType, "news")
                        .eq(LikeRecord::getTargetId, newsId)
                        .last("LIMIT 1")) != null;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("liked", liked);
        result.put("likeCount", currentLikeCount(newsId));
        return result;
    }

    private int currentLikeCount(Long newsId) {
        News news = newsMapper.selectById(newsId);
        if (news == null || news.getLikeCount() == null) {
            return 0;
        }
        return news.getLikeCount();
    }

    @Transactional
    public Map<String, Object> toggleFavorite(Long newsId) {
        return favoriteService.toggle("news", newsId);
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
