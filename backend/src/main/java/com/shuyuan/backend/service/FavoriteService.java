package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全模块收藏：news / hall / craft / course / resource
 */
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "news", "hall", "craft", "course", "resource");

    private final FavoriteMapper favoriteMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CraftMapper craftMapper;
    private final CourseMapper courseMapper;
    private final ResourceMapper resourceMapper;
    private final EventLogService eventLogService;
    private final PointService pointService;

    @Transactional
    public Map<String, Object> toggle(String targetType, Long targetId) {
        String type = normalizeType(targetType);
        validateTargetPublished(type, targetId);
        Long memberId = requireMemberId();

        Favorite existing = favoriteMapper.selectOne(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId)
                .eq(Favorite::getTargetType, type)
                .eq(Favorite::getTargetId, targetId)
                .last("LIMIT 1"));

        boolean collected;
        boolean changed = false;
        if (existing != null) {
            int affected = favoriteMapper.physicalDeleteByIdAndMember(existing.getId(), memberId);
            collected = false;
            changed = affected > 0;
        } else {
            // 清掉历史软删残留，避免 uk_member_target 冲突导致 500
            favoriteMapper.physicalDeleteByTarget(memberId, type, targetId);
            try {
                Favorite record = new Favorite();
                record.setMemberId(memberId);
                record.setTargetType(type);
                record.setTargetId(targetId);
                favoriteMapper.insert(record);
                collected = true;
                changed = true;
                eventLogService.recordIfLoggedIn("favorite", type, targetId);
                pointService.awardCurrentUser("favorite");
            } catch (DuplicateKeyException ex) {
                collected = isCollected(type, targetId);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("collected", collected);
        result.put("targetType", type);
        result.put("targetId", targetId);
        if ("news".equals(type)) {
            result.put("favoriteCount", changed
                    ? adjustNewsFavoriteCount(targetId, collected ? 1 : -1)
                    : currentNewsFavoriteCount(targetId));
        }
        return result;
    }

    public void enrichCollected(Map<String, Object> detail, String targetType, Long targetId) {
        if (detail == null || targetId == null) {
            return;
        }
        detail.put("collected", isCollected(normalizeType(targetType), targetId));
    }

    /** 列表页批量标记 collected（单次查询） */
    public void enrichListCollected(List<Map<String, Object>> items, String targetType) {
        if (items == null || items.isEmpty()) {
            return;
        }
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            items.forEach(item -> item.put("collected", false));
            return;
        }
        String type = normalizeType(targetType);
        Set<Long> ids = items.stream()
                .map(item -> item.get("id"))
                .filter(id -> id instanceof Number)
                .map(id -> ((Number) id).longValue())
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return;
        }
        Set<Long> collectedIds = favoriteMapper.selectList(new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getMemberId, memberId)
                        .eq(Favorite::getTargetType, type)
                        .in(Favorite::getTargetId, ids))
                .stream()
                .map(Favorite::getTargetId)
                .collect(Collectors.toCollection(HashSet::new));
        for (Map<String, Object> item : items) {
            Object id = item.get("id");
            boolean collected = id instanceof Number && collectedIds.contains(((Number) id).longValue());
            item.put("collected", collected);
        }
    }

    public boolean isCollected(String targetType, Long targetId) {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null || targetId == null) {
            return false;
        }
        String type = normalizeType(targetType);
        Favorite favorite = favoriteMapper.selectOne(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getMemberId, memberId)
                .eq(Favorite::getTargetType, type)
                .eq(Favorite::getTargetId, targetId)
                .last("LIMIT 1"));
        return favorite != null;
    }

    private int adjustNewsFavoriteCount(Long newsId, int delta) {
        newsMapper.adjustFavoriteCount(newsId, delta);
        return currentNewsFavoriteCount(newsId);
    }

    private int currentNewsFavoriteCount(Long newsId) {
        News news = newsMapper.selectById(newsId);
        if (news == null || news.getFavoriteCount() == null) {
            return 0;
        }
        return news.getFavoriteCount();
    }

    private void validateTargetPublished(String type, Long targetId) {
        if (targetId == null || targetId <= 0) {
            throw new BusinessException(400, "收藏对象无效");
        }
        switch (type) {
            case "news" -> {
                News news = newsMapper.selectById(targetId);
                if (news == null || !"published".equals(news.getStatus())) {
                    throw new BusinessException(404, "资讯不存在");
                }
            }
            case "hall" -> {
                Hall hall = hallMapper.selectById(targetId);
                if (hall == null || hall.getStatus() == null || hall.getStatus() != 1) {
                    throw new BusinessException(404, "展馆不存在");
                }
            }
            case "craft" -> {
                Craft craft = craftMapper.selectById(targetId);
                if (craft == null || craft.getStatus() == null || craft.getStatus() != 1) {
                    throw new BusinessException(404, "文创不存在");
                }
            }
            case "course" -> {
                Course course = courseMapper.selectById(targetId);
                if (course == null || course.getStatus() == null || course.getStatus() != 1) {
                    throw new BusinessException(404, "课程不存在");
                }
            }
            case "resource" -> {
                Resource resource = resourceMapper.selectById(targetId);
                if (resource == null || resource.getStatus() == null || resource.getStatus() != 1) {
                    throw new BusinessException(404, "资源不存在");
                }
            }
            default -> throw new BusinessException(400, "不支持的收藏类型");
        }
    }

    private String normalizeType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            throw new BusinessException(400, "请指定收藏类型");
        }
        String type = targetType.trim().toLowerCase();
        if (!ALLOWED_TYPES.contains(type)) {
            throw new BusinessException(400, "不支持的收藏类型");
        }
        return type;
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
