package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.entity.SearchIndex;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.mapper.SearchIndexMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 搜索索引同步（内容发布/下架时调用，与 docs Phase 2 一致）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchIndexSyncService {

    private static final int UPSERT_BATCH_SIZE = 200;

    private final SearchIndexMapper searchIndexMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CourseMapper courseMapper;
    private final CraftMapper craftMapper;
    private final ResourceMapper resourceMapper;

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

    /**
     * 全量同步已发布内容至 search_index（定时任务兜底，修复漏同步或下架残留）
     */
    @Transactional
    public int syncAllPublished() {
        List<SearchIndex> activeRows = new ArrayList<>();

        List<News> newsList = newsMapper.selectList(new LambdaQueryWrapper<News>()
                .eq(News::getStatus, "published"));
        for (News news : newsList) {
            activeRows.add(indexRow("news", news.getId(), news.getTitle(),
                    news.getSummary(), news.getCover(), news.getPublishTime()));
        }

        List<Hall> halls = hallMapper.selectList(new LambdaQueryWrapper<Hall>()
                .eq(Hall::getStatus, 1));
        for (Hall hall : halls) {
            activeRows.add(indexRow("hall", hall.getId(), hall.getName(),
                    hall.getIntro(), hall.getCover(), LocalDateTime.now()));
        }

        List<Course> courses = courseMapper.selectList(new LambdaQueryWrapper<Course>()
                .eq(Course::getStatus, 1));
        for (Course course : courses) {
            activeRows.add(indexRow("course", course.getId(), course.getName(),
                    course.getIntro(), course.getCover(), course.getStartTime()));
        }

        List<Craft> crafts = craftMapper.selectList(new LambdaQueryWrapper<Craft>()
                .eq(Craft::getStatus, 1));
        for (Craft craft : crafts) {
            activeRows.add(indexRow("craft", craft.getId(), craft.getName(),
                    craft.getIntroZh(), craft.getCover(), craft.getCreateTime()));
        }

        List<Resource> resources = resourceMapper.selectList(new LambdaQueryWrapper<Resource>()
                .eq(Resource::getStatus, 1));
        for (Resource resource : resources) {
            String summary = resource.getFileType() != null
                    ? resource.getFileType().toUpperCase() + " 学习资料"
                    : "学习资料";
            activeRows.add(indexRow("resource", resource.getId(), resource.getName(),
                    summary, null, resource.getCreateTime()));
        }

        int reset = searchIndexMapper.disableAllEnabled();
        for (int from = 0; from < activeRows.size(); from += UPSERT_BATCH_SIZE) {
            int to = Math.min(from + UPSERT_BATCH_SIZE, activeRows.size());
            searchIndexMapper.upsertBatch(activeRows.subList(from, to));
        }
        log.info("search_index 全量同步完成：活跃 {} 条，刷新前启用 {} 条",
                activeRows.size(), reset);
        return activeRows.size();
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

    private SearchIndex indexRow(String type, Long targetId, String title, String summary,
                                 String cover, LocalDateTime publishTime) {
        SearchIndex row = new SearchIndex();
        row.setTargetType(type);
        row.setTargetId(targetId);
        row.setTitle(title != null ? title : "");
        row.setSummary(summary);
        row.setCover(cover);
        row.setPublishTime(publishTime != null ? publishTime : LocalDateTime.now());
        row.setStatus(1);
        return row;
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
