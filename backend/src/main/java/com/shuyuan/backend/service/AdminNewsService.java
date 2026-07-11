package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.NewsSaveRequest;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.util.FormatUtils;
import com.shuyuan.backend.util.CoverFitMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminNewsService {

    private final NewsMapper newsMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;

    public PageResult<Map<String, Object>> list(String status, Long categoryId, int page, int size) {
        adminPermissionService.require("news:read");
        LambdaQueryWrapper<News> qw = new LambdaQueryWrapper<News>()
                .orderByDesc(News::getIsTop)
                .orderByDesc(News::getUpdateTime);
        if (status != null && !status.isBlank()) {
            qw.eq(News::getStatus, status);
        }
        if (categoryId != null && categoryId > 0) {
            qw.eq(News::getCategoryId, categoryId);
        }
        Page<News> p = newsMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, String> catMap = categoryService.nameMap("news");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(n -> toVo(n, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> create(NewsSaveRequest req) {
        adminPermissionService.require("news:write");
        validateContent(req);
        News news = fromRequest(new News(), req);
        news.setStatus("draft");
        news.setViewCount(0);
        news.setLikeCount(0);
        news.setFavoriteCount(0);
        if (news.getIsTop() == null) {
            news.setIsTop(0);
        }
        newsMapper.insert(news);
        return toVo(newsMapper.selectById(news.getId()), categoryService.nameMap("news"));
    }

    public Map<String, Object> update(Long id, NewsSaveRequest req) {
        adminPermissionService.require("news:write");
        News news = requireNews(id);
        fromRequest(news, req);
        newsMapper.updateById(news);
        if ("published".equals(news.getStatus())) {
            searchIndexSyncService.syncNews(newsMapper.selectById(id));
        }
        return toVo(newsMapper.selectById(id), categoryService.nameMap("news"));
    }

    @Transactional
    public Map<String, Object> publish(Long id) {
        adminPermissionService.require("news:publish");
        News news = requireNews(id);
        if ("published".equals(news.getStatus())) {
            throw new BusinessException(400, "新闻已发布");
        }
        news.setStatus("published");
        if (news.getPublishTime() == null) {
            news.setPublishTime(LocalDateTime.now());
        }
        newsMapper.updateById(news);
        News published = newsMapper.selectById(id);
        searchIndexSyncService.syncNews(published);
        return toVo(published, categoryService.nameMap("news"));
    }

    @Transactional
    public Map<String, Object> unpublish(Long id) {
        adminPermissionService.require("news:publish");
        News news = requireNews(id);
        if (!"published".equals(news.getStatus())) {
            throw new BusinessException(400, "仅已发布新闻可下架");
        }
        news.setStatus("draft");
        newsMapper.updateById(news);
        searchIndexSyncService.removeNews(id);
        return toVo(newsMapper.selectById(id), categoryService.nameMap("news"));
    }

    @Transactional
    public void delete(Long id) {
        adminPermissionService.require("news:write");
        News news = requireNews(id);
        if (!"draft".equals(news.getStatus())) {
            throw new BusinessException(400, "仅草稿新闻可删除，请先下架");
        }
        newsMapper.deleteById(id);
        searchIndexSyncService.removeNews(id);
    }

    private News requireNews(Long id) {
        News news = newsMapper.selectById(id);
        if (news == null) {
            throw new BusinessException(404, "新闻不存在");
        }
        return news;
    }

    private void validateContent(NewsSaveRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new BusinessException(400, "标题不能为空");
        }
    }

    private News fromRequest(News news, NewsSaveRequest req) {
        if (req.getTitle() != null) {
            news.setTitle(req.getTitle());
        }
        if (req.getCover() != null) {
            news.setCover(req.getCover());
        }
        if (req.getCoverFitMode() != null) {
            news.setCoverFitMode(CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getSummary() != null) {
            news.setSummary(req.getSummary());
        }
        if (req.getContent() != null) {
            news.setContent(req.getContent());
        }
        if (req.getCategoryId() != null) {
            news.setCategoryId(req.getCategoryId());
        }
        if (req.getIsTop() != null) {
            news.setIsTop(req.getIsTop());
        }
        return news;
    }

    private Map<String, Object> toVo(News n, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("cover", n.getCover());
        m.put("coverFitMode", CoverFitMode.normalize(n.getCoverFitMode()));
        m.put("summary", n.getSummary());
        m.put("content", n.getContent());
        m.put("categoryId", n.getCategoryId());
        m.put("categoryName", categoryService.getName(n.getCategoryId(), catMap));
        m.put("status", n.getStatus());
        m.put("isTop", n.getIsTop());
        m.put("viewCount", n.getViewCount());
        m.put("publishTime", FormatUtils.formatDateTime(n.getPublishTime()));
        m.put("updateTime", FormatUtils.formatDateTime(n.getUpdateTime()));
        return m;
    }
}
