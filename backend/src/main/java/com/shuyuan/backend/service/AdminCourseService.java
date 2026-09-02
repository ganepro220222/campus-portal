package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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
import com.shuyuan.backend.util.OssManagedObjectKey;
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
    private final OssMediaCleanupService ossMediaCleanupService;

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
        // 保存接口只负责内容编辑；上下架必须经过 course:publish 权限入口。
        course.setStatus(0);
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
        Course course = requireCourseForUpdate(id);
        String oldCover = course.getCover();
        String oldVideo = course.getVideoUrl();
        String oldSubtitle = course.getSubtitleUrl();
        fromRequest(course, req);
        boolean videoChanged = !OssManagedObjectKey.sameStoredMedia(oldVideo, course.getVideoUrl());
        boolean newSubtitleProvided = req.getSubtitleUrl() != null
                && !req.getSubtitleUrl().isBlank()
                && !OssManagedObjectKey.sameStoredMedia(oldSubtitle, req.getSubtitleUrl());
        SubtitleMutation subtitleMutation = newSubtitleProvided
                ? SubtitleMutation.MANUAL_READY
                : videoChanged ? SubtitleMutation.CLEAR_FOR_NEW_VIDEO : SubtitleMutation.NONE;
        if (subtitleMutation == SubtitleMutation.CLEAR_FOR_NEW_VIDEO) {
            clearSubtitleFieldsInMemory(course);
        } else if (subtitleMutation == SubtitleMutation.MANUAL_READY) {
            prepareManualSubtitleInMemory(course);
        }
        courseMapper.updateById(course);
        if (req.getStartTime() != null && req.getStartTime().isBlank()) {
            // updateById 默认忽略 null；空串表达“清除开课时间”时必须显式 SET NULL。
            courseMapper.update(null, new LambdaUpdateWrapper<Course>()
                    .eq(Course::getId, id)
                    .set(Course::getStartTime, null));
        }
        if (subtitleMutation != SubtitleMutation.NONE) {
            persistSubtitleMutation(id, course, subtitleMutation);
        }
        syncResources(id, req.getResourceIds());
        Course saved = courseMapper.selectById(id);
        syncSearchIfOnline(saved);
        ossMediaCleanupService.afterReplace(oldCover, saved.getCover());
        ossMediaCleanupService.afterReplace(oldVideo, saved.getVideoUrl());
        ossMediaCleanupService.afterReplace(oldSubtitle, saved.getSubtitleUrl());
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
        // 从读取视频到记录 taskId 全程锁定课程行，避免并发换视频后写入旧视频的 ASR 任务。
        Course course = requireCourseForUpdate(id);
        if (course.getVideoUrl() == null || course.getVideoUrl().isBlank()) {
            throw new BusinessException(400, "请先配置视频地址");
        }
        if ("processing".equals(course.getSubtitleStatus())) {
            throw new BusinessException(400, "字幕任务进行中，请勿重复提交");
        }
        if (!asrService.isConfigured()) {
            throw new BusinessException(503, "ASR 未配置，请设置 ASR_ACCESS_KEY_ID / ASR_ACCESS_KEY_SECRET / ASR_APP_KEY，或手动上传字幕后保存");
        }
        String mediaUrl = ossService.signTrustedVideoUrlForAsr(course.getVideoUrl());
        String taskId = asrService.submit(mediaUrl);
        // 上一轮的 lastPollAt / lastError 必须真清掉，否则新任务一开始就带着旧报错。
        // updateById 会跳过 null 字段（updateStrategy 默认 NOT_NULL），只能用 LambdaUpdateWrapper。
        courseMapper.update(null, new LambdaUpdateWrapper<Course>()
                .eq(Course::getId, id)
                .set(Course::getSubtitleStatus, "processing")
                .set(Course::getSubtitleTaskId, taskId)
                .set(Course::getSubtitleAsrStartedAt, java.time.LocalDateTime.now())
                .set(Course::getSubtitleAsrLastPollAt, null)
                .set(Course::getSubtitleAsrAttemptCount, 0)
                .set(Course::getSubtitleAsrLastError, null));
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
        m.put("subtitleLastError", course.getSubtitleAsrLastError());
        m.put("videoUrl", course.getVideoUrl());
        return m;
    }

    @Transactional
    public Map<String, Object> updateSubtitle(Long id, SubtitleUpdateRequest req) {
        adminPermissionService.require("course:write");
        Course existing = requireCourseForUpdate(id);
        if (req == null || req.getSubtitleUrl() == null || req.getSubtitleUrl().isBlank()) {
            throw new BusinessException(400, "字幕地址不能为空");
        }
        String newUrl = req.getSubtitleUrl().trim();
        courseMapper.update(null, new LambdaUpdateWrapper<Course>()
                .eq(Course::getId, id)
                .set(Course::getSubtitleUrl, newUrl)
                .set(Course::getSubtitleStatus, "ready")
                .set(Course::getSubtitleTaskId, null)
                .set(Course::getSubtitleAsrStartedAt, null)
                .set(Course::getSubtitleAsrLastPollAt, null)
                .set(Course::getSubtitleAsrAttemptCount, 0)
                .set(Course::getSubtitleAsrLastError, null));
        ossMediaCleanupService.afterReplace(existing.getSubtitleUrl(), newUrl);
        return subtitleStatus(id);
    }

    @Transactional
    public void delete(Long id) {
        adminPermissionService.require("course:write");
        Course course = requireCourse(id);
        if (course.getStatus() != null && course.getStatus() == 1) {
            throw new BusinessException(400, "请先下架课程，再删除到回收站");
        }
        courseMapper.deleteById(id);
        searchIndexSyncService.removeCourse(id);
    }

    private Course requireCourse(Long id) {
        Course course = courseMapper.selectById(id);
        if (course == null) {
            throw new BusinessException(404, "课程不存在");
        }
        return course;
    }

    private Course requireCourseForUpdate(Long id) {
        Course course = courseMapper.selectByIdForUpdate(id);
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
        if (req.getSubtitleUrl() != null && !req.getSubtitleUrl().isBlank()) {
            course.setSubtitleUrl(req.getSubtitleUrl().trim());
        }
        return course;
    }

    private static void clearSubtitleFieldsInMemory(Course course) {
        course.setSubtitleStatus("none");
        course.setSubtitleAsrAttemptCount(0);
    }

    private static void prepareManualSubtitleInMemory(Course course) {
        course.setSubtitleStatus("ready");
        course.setSubtitleAsrAttemptCount(0);
    }

    /**
     * updateById 会跳过 NULL；需要显式 SET 才能真正取消旧 ASR 任务并清空字幕地址。
     */
    private void persistSubtitleMutation(Long id, Course course, SubtitleMutation mutation) {
        LambdaUpdateWrapper<Course> update = new LambdaUpdateWrapper<Course>()
                .eq(Course::getId, id)
                .set(Course::getSubtitleStatus, course.getSubtitleStatus())
                .set(Course::getSubtitleTaskId, null)
                .set(Course::getSubtitleAsrStartedAt, null)
                .set(Course::getSubtitleAsrLastPollAt, null)
                .set(Course::getSubtitleAsrAttemptCount, 0)
                .set(Course::getSubtitleAsrLastError, null);
        if (mutation == SubtitleMutation.CLEAR_FOR_NEW_VIDEO) {
            update.set(Course::getSubtitleUrl, null);
        } else {
            update.set(Course::getSubtitleUrl, course.getSubtitleUrl());
        }
        courseMapper.update(null, update);
    }

    private enum SubtitleMutation {
        NONE,
        CLEAR_FOR_NEW_VIDEO,
        MANUAL_READY
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
