package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseResource;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseResourceMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseMapper courseMapper;
    private final CourseResourceMapper courseResourceMapper;
    private final ResourceMapper resourceMapper;
    private final CategoryService categoryService;
    private final EventLogService eventLogService;
    private final OssService ossService;

    public List<Map<String, Object>> list(String category) {
        Map<Long, String> catMap = categoryService.nameMap("course");
        LambdaQueryWrapper<Course> qw = new LambdaQueryWrapper<Course>()
                .eq(Course::getStatus, 1)
                .orderByDesc(Course::getStartTime);
        if (category != null && !category.isBlank() && !"全部".equals(category)) {
            Long cid = categoryService.findIdByName("course", category);
            if (cid != null) {
                qw.eq(Course::getCategoryId, cid);
            }
        }
        return courseMapper.selectList(qw).stream()
                .map(c -> toListItem(c, catMap))
                .toList();
    }

    public Map<String, Object> detail(Long id) {
        Course course = courseMapper.selectById(id);
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            throw new BusinessException(404, "课程不存在");
        }
        Map<Long, String> catMap = categoryService.nameMap("course");
        String categoryName = categoryService.getName(course.getCategoryId(), catMap);
        boolean hasSubtitle = "ready".equals(course.getSubtitleStatus());

        Map<String, Object> m = new HashMap<>();
        m.put("id", course.getId());
        m.put("name", course.getName());
        m.put("cover", ossService.signUrl(course.getCover()));
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(course.getCoverFitMode()));
        m.put("intro", course.getIntro());
        m.put("category", categoryName);
        m.put("audience", course.getTargetAudience());
        m.put("targetAudience", course.getTargetAudience());
        m.put("duration", course.getDurationMinutes() != null ? course.getDurationMinutes() + " 分钟" : "");
        m.put("openTime", FormatUtils.formatDate(course.getStartTime()));
        m.put("videoUrl", ossService.signUrl(course.getVideoUrl()));
        m.put("subtitleUrl", ossService.signUrl(course.getSubtitleUrl()));
        m.put("hasSubtitle", hasSubtitle);
        m.put("tags", List.of(categoryName, hasSubtitle ? "AI 字幕" : "在线课程"));
        m.put("resources", loadLinkedResources(id));
        eventLogService.record("view", "course", id);
        return m;
    }

    /** 课程配套资源（供小程序详情页展示） */
    private List<Map<String, Object>> loadLinkedResources(Long courseId) {
        List<CourseResource> links = courseResourceMapper.selectList(
                new LambdaQueryWrapper<CourseResource>()
                        .eq(CourseResource::getCourseId, courseId)
                        .orderByAsc(CourseResource::getSort));
        if (links.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (CourseResource link : links) {
            Resource r = resourceMapper.selectById(link.getResourceId());
            if (r == null || r.getStatus() == null || r.getStatus() != 1) {
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("name", r.getName());
            item.put("fileType", r.getFileType());
            item.put("fileSizeText", formatFileSize(r.getFileSizeKb()));
            list.add(item);
        }
        return list;
    }

    private String formatFileSize(Integer kb) {
        if (kb == null || kb <= 0) {
            return "";
        }
        if (kb >= 1024) {
            return String.format("%.1f MB", kb / 1024.0);
        }
        return kb + " KB";
    }

    private Map<String, Object> toListItem(Course c, Map<Long, String> catMap) {
        String categoryName = categoryService.getName(c.getCategoryId(), catMap);
        boolean hasSubtitle = "ready".equals(c.getSubtitleStatus());
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", ossService.signUrl(c.getCover()));
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(c.getCoverFitMode()));
        m.put("cat", categoryName);
        m.put("categoryName", categoryName);
        m.put("audience", c.getTargetAudience());
        m.put("targetAudience", c.getTargetAudience());
        m.put("lessonCount", c.getDurationMinutes() != null ? Math.max(1, c.getDurationMinutes() / 45) : 0);
        m.put("tag", hasSubtitle ? "AI 字幕" : categoryName);
        m.put("tagGold", hasSubtitle);
        m.put("desc", c.getIntro());
        return m;
    }
}
