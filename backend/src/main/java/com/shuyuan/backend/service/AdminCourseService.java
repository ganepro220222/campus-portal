package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CourseSaveRequest;
import com.shuyuan.backend.dto.SubtitleUpdateRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.CourseResource;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CourseResourceMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import com.shuyuan.backend.util.CoverFitMode;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminCourseService {

    private final CourseMapper courseMapper;
    private final CourseResourceMapper courseResourceMapper;
    private final ResourceMapper resourceMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;
    private final AsrService asrService;
    private final OssService ossService;

    public PageResult<Map<String, Object>> list(Long categoryId, Integer status, int page, int size) {
        adminPermissionService.require("course:read");
        LambdaQueryWrapper<Course> qw = new LambdaQueryWrapper<Course>()
                .orderByDesc(Course::getStartTime);
        if (categoryId != null && categoryId > 0) {
            qw.eq(Course::getCategoryId, categoryId);
        }
        if (status != null) {
            qw.eq(Course::getStatus, status);
        }
        Page<Course> p = courseMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, String> catMap = categoryService.nameMap("course");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(c -> toVo(c, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("course:read");
        Course course = requireCourse(id);
        Map<String, Object> vo = toVo(course, categoryService.nameMap("course"));
        vo.put("resourceIds", listResourceIds(id));
        vo.put("resources", listLinkedResources(id));
        return vo;
    }

    @Transactional
    public Map<String, Object> create(CourseSaveRequest req) {
        adminPermissionService.require("course:write");
        validateName(req);
        Course course = fromRequest(new Course(), req);
        if (course.getStatus() == null) {
            course.setStatus(0);
        }
        if (course.getSubtitleStatus() == null || course.getSubtitleStatus().isBlank()) {
            course.setSubtitleStatus(resolveSubtitleStatus(course));
        }
        courseMapper.insert(course);
        syncResources(course.getId(), req.getResourceIds());
        Course saved = courseMapper.selectById(course.getId());
        syncSearchIfOnline(saved);
        return detail(saved.getId());
    }

    @Transactional
    public Map<String, Object> update(Long id, CourseSaveRequest req) {
        adminPermissionService.require("course:write");
        Course course = requireCourse(id);
        fromRequest(course, req);
        if (course.getSubtitleUrl() != null && !course.getSubtitleUrl().isBlank()) {
            course.setSubtitleStatus("ready");
        }
        courseMapper.updateById(course);
        syncResources(id, req.getResourceIds());
        Course saved = courseMapper.selectById(id);
        syncSearchIfOnline(saved);
        return detail(id);
    }

    @Transactional
    public Map<String, Object> publish(Long id) {
        adminPermissionService.require("course:publish");
        Course course = requireCourse(id);
        if (course.getStatus() != null && course.getStatus() == 1) {
            throw new BusinessException(400, "课程已上架");
        }
        course.setStatus(1);
        courseMapper.updateById(course);
        syncSearchIfOnline(courseMapper.selectById(id));
        return detail(id);
    }

    @Transactional
    public Map<String, Object> unpublish(Long id) {
        adminPermissionService.require("course:publish");
        Course course = requireCourse(id);
        if (course.getStatus() == null || course.getStatus() != 1) {
            throw new BusinessException(400, "仅已上架课程可下架");
        }
        course.setStatus(0);
        courseMapper.updateById(course);
        searchIndexSyncService.removeCourse(id);
        return detail(id);
    }

    /** 触发字幕生成（提交 ASR 任务，轮询完成后写入 subtitle_url） */
    @Transactional
    public Map<String, Object> triggerSubtitle(Long id) {
        adminPermissionService.require("course:write");
        Course course = requireCourse(id);
        if (course.getVideoUrl() == null || course.getVideoUrl().isBlank()) {
            throw new BusinessException(400, "请先配置视频地址");
        }
        if ("processing".equals(course.getSubtitleStatus())) {
            throw new BusinessException(400, "字幕任务进行中，请勿重复提交");
        }
        if (!asrService.isConfigured()) {
            throw new BusinessException(503, "ASR 未配置，请设置 ASR_ACCESS_KEY_ID / ASR_ACCESS_KEY_SECRET / ASR_APP_KEY，或手动上传字幕后保存");
        }
        String mediaUrl = ossService.signUrl(course.getVideoUrl());
        String taskId = asrService.submit(mediaUrl);
        Course update = new Course();
        update.setId(id);
        update.setSubtitleStatus("processing");
        update.setSubtitleTaskId(taskId);
        courseMapper.updateById(update);
        return subtitleStatus(id);
    }

    public Map<String, Object> subtitleStatus(Long id) {
        adminPermissionService.require("course:read");
        Course course = requireCourse(id);
        Map<String, Object> m = new HashMap<>();
        m.put("courseId", id);
        m.put("subtitleStatus", course.getSubtitleStatus());
        m.put("subtitleStatusLabel", subtitleStatusLabel(course.getSubtitleStatus()));
        m.put("subtitleUrl", course.getSubtitleUrl());
        m.put("subtitleTaskId", course.getSubtitleTaskId());
        m.put("videoUrl", course.getVideoUrl());
        return m;
    }

    @Transactional
    public Map<String, Object> updateSubtitle(Long id, SubtitleUpdateRequest req) {
        adminPermissionService.require("course:write");
        requireCourse(id);
        if (req == null || req.getSubtitleUrl() == null || req.getSubtitleUrl().isBlank()) {
            throw new BusinessException(400, "字幕地址不能为空");
        }
        Course update = new Course();
        update.setId(id);
        update.setSubtitleUrl(req.getSubtitleUrl().trim());
        update.setSubtitleStatus("ready");
        courseMapper.updateById(update);
        return subtitleStatus(id);
    }

    private Course requireCourse(Long id) {
        Course course = courseMapper.selectById(id);
        if (course == null) {
            throw new BusinessException(404, "课程不存在");
        }
        return course;
    }

    private void validateName(CourseSaveRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "课程名称不能为空");
        }
    }

    private Course fromRequest(Course course, CourseSaveRequest req) {
        if (req.getName() != null) {
            course.setName(req.getName());
        }
        if (req.getCover() != null) {
            course.setCover(req.getCover());
        }
        if (req.getCoverFitMode() != null) {
            course.setCoverFitMode(CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getCategoryId() != null) {
            course.setCategoryId(req.getCategoryId());
        }
        if (req.getTargetAudience() != null) {
            course.setTargetAudience(req.getTargetAudience());
        }
        if (req.getDurationMinutes() != null) {
            course.setDurationMinutes(req.getDurationMinutes());
        }
        if (req.getStartTime() != null) {
            course.setStartTime(FormatUtils.parseDateTime(req.getStartTime()));
        }
        if (req.getIntro() != null) {
            course.setIntro(req.getIntro());
        }
        if (req.getVideoUrl() != null) {
            course.setVideoUrl(req.getVideoUrl());
        }
        if (req.getSubtitleUrl() != null) {
            course.setSubtitleUrl(req.getSubtitleUrl());
        }
        if (req.getStatus() != null) {
            course.setStatus(req.getStatus());
        }
        return course;
    }

    private void syncResources(Long courseId, List<Long> resourceIds) {
        if (resourceIds == null) {
            return;
        }
        courseResourceMapper.delete(new LambdaQueryWrapper<CourseResource>()
                .eq(CourseResource::getCourseId, courseId));
        int sort = 0;
        for (Long resourceId : resourceIds) {
            if (resourceId == null || resourceId <= 0) {
                continue;
            }
            Resource resource = resourceMapper.selectById(resourceId);
            if (resource == null) {
                continue;
            }
            CourseResource link = new CourseResource();
            link.setCourseId(courseId);
            link.setResourceId(resourceId);
            link.setSort(sort++);
            courseResourceMapper.insert(link);
        }
    }

    private List<Long> listResourceIds(Long courseId) {
        return courseResourceMapper.selectList(new LambdaQueryWrapper<CourseResource>()
                        .eq(CourseResource::getCourseId, courseId)
                        .orderByAsc(CourseResource::getSort))
                .stream()
                .map(CourseResource::getResourceId)
                .toList();
    }

    private List<Map<String, Object>> listLinkedResources(Long courseId) {
        List<Long> ids = listResourceIds(courseId);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (Long rid : ids) {
            Resource r = resourceMapper.selectById(rid);
            if (r == null) {
                continue;
            }
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("name", r.getName());
            m.put("fileType", r.getFileType());
            list.add(m);
        }
        return list;
    }

    private void syncSearchIfOnline(Course course) {
        if (course.getStatus() != null && course.getStatus() == 1) {
            searchIndexSyncService.syncCourse(course);
        } else {
            searchIndexSyncService.removeCourse(course.getId());
        }
    }

    private String resolveSubtitleStatus(Course course) {
        if (course.getSubtitleUrl() != null && !course.getSubtitleUrl().isBlank()) {
            return "ready";
        }
        return "none";
    }

    private Map<String, Object> toVo(Course c, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", c.getCover());
        m.put("coverFitMode", CoverFitMode.normalize(c.getCoverFitMode()));
        m.put("categoryId", c.getCategoryId());
        m.put("categoryName", categoryService.getName(c.getCategoryId(), catMap));
        m.put("targetAudience", c.getTargetAudience());
        m.put("durationMinutes", c.getDurationMinutes());
        m.put("startTime", FormatUtils.formatDateTime(c.getStartTime()));
        m.put("intro", c.getIntro());
        m.put("videoUrl", c.getVideoUrl());
        m.put("subtitleUrl", c.getSubtitleUrl());
        m.put("subtitleStatus", c.getSubtitleStatus());
        m.put("subtitleStatusLabel", subtitleStatusLabel(c.getSubtitleStatus()));
        m.put("subtitleTaskId", c.getSubtitleTaskId());
        m.put("status", c.getStatus());
        return m;
    }

    private String subtitleStatusLabel(String status) {
        if (status == null) {
            return "未生成";
        }
        return switch (status) {
            case "processing" -> "生成中";
            case "ready" -> "已就绪";
            case "failed" -> "失败";
            default -> "未生成";
        };
    }
}
