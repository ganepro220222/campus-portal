package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.entity.SearchIndex;
import com.shuyuan.backend.mapper.SearchIndexMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 搜索索引同步（内容发布/下架时调用，与 docs Phase 2 一致）
 */
@Service
@RequiredArgsConstructor
public class SearchIndexSyncService {

    private final SearchIndexMapper searchIndexMapper;

    public void syncNews(News news) {
        if (news == null || !"published".equals(news.getStatus())) {
            return;
        }
        upsert("news", news.getId(), news.getTitle(),
                news.getSummary(), news.getCover(), news.getPublishTime());
    }

    public void removeNews(Long newsId) {
        disable("news", newsId);
    }

    public void syncHall(Hall hall) {
        if (hall == null || hall.getStatus() == null || hall.getStatus() != 1) {
            return;
        }
        upsert("hall", hall.getId(), hall.getName(),
                hall.getIntro(), hall.getCover(), LocalDateTime.now());
    }

    public void removeHall(Long hallId) {
        disable("hall", hallId);
    }

    public void syncCourse(Course course) {
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            return;
        }
        upsert("course", course.getId(), course.getName(),
                course.getIntro(), course.getCover(), course.getStartTime());
    }

    public void removeCourse(Long courseId) {
        disable("course", courseId);
    }

    public void syncResource(Resource resource) {
        if (resource == null || resource.getStatus() == null || resource.getStatus() != 1) {
            return;
        }
        String summary = resource.getFileType() != null
                ? resource.getFileType().toUpperCase() + " 学习资料"
                : "学习资料";
        upsert("resource", resource.getId(), resource.getName(),
                summary, null, resource.getCreateTime());
    }

    public void removeResource(Long resourceId) {
        disable("resource", resourceId);
    }

    public void syncCraft(Craft craft) {
        if (craft == null || craft.getStatus() == null || craft.getStatus() != 1) {
            return;
        }
        upsert("craft", craft.getId(), craft.getName(),
                craft.getIntroZh(), craft.getCover(), craft.getCreateTime());
    }

    public void removeCraft(Long craftId) {
        disable("craft", craftId);
    }

    private void upsert(String type, Long targetId, String title, String summary,
                        String cover, LocalDateTime publishTime) {
        SearchIndex existing = searchIndexMapper.selectOne(new LambdaQueryWrapper<SearchIndex>()
                .eq(SearchIndex::getTargetType, type)
                .eq(SearchIndex::getTargetId, targetId)
                .last("LIMIT 1"));
        if (existing != null) {
            existing.setTitle(title != null ? title : "");
            existing.setSummary(summary);
            existing.setCover(cover);
            existing.setPublishTime(publishTime != null ? publishTime : LocalDateTime.now());
            existing.setStatus(1);
            searchIndexMapper.updateById(existing);
        } else {
            SearchIndex row = new SearchIndex();
            row.setTargetType(type);
            row.setTargetId(targetId);
            row.setTitle(title != null ? title : "");
            row.setSummary(summary);
            row.setCover(cover);
            row.setPublishTime(publishTime != null ? publishTime : LocalDateTime.now());
            row.setStatus(1);
            searchIndexMapper.insert(row);
        }
    }

    private void disable(String type, Long targetId) {
        SearchIndex existing = searchIndexMapper.selectOne(new LambdaQueryWrapper<SearchIndex>()
                .eq(SearchIndex::getTargetType, type)
                .eq(SearchIndex::getTargetId, targetId)
                .last("LIMIT 1"));
        if (existing != null) {
            existing.setStatus(0);
            searchIndexMapper.updateById(existing);
        }
    }
}
