package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseMapper courseMapper;
    private final CategoryService categoryService;

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
        m.put("cover", course.getCover());
        m.put("intro", course.getIntro());
        m.put("category", categoryName);
        m.put("audience", course.getTargetAudience());
        m.put("targetAudience", course.getTargetAudience());
        m.put("duration", course.getDurationMinutes() != null ? course.getDurationMinutes() + " 分钟" : "");
        m.put("openTime", FormatUtils.formatDate(course.getStartTime()));
        m.put("videoUrl", course.getVideoUrl());
        m.put("subtitleUrl", course.getSubtitleUrl());
        m.put("tags", List.of(categoryName, hasSubtitle ? "AI 字幕" : "在线课程"));
        m.put("resources", List.of());
        return m;
    }

    private Map<String, Object> toListItem(Course c, Map<Long, String> catMap) {
        String categoryName = categoryService.getName(c.getCategoryId(), catMap);
        boolean hasSubtitle = "ready".equals(c.getSubtitleStatus());
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", c.getCover());
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
