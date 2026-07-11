package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ActivitySaveRequest;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminActivityService {

    private final ActivityMapper activityMapper;
    private final AdminPermissionService adminPermissionService;

    public PageResult<Map<String, Object>> list(String status, int page, int size) {
        adminPermissionService.require("enroll:read");
        LambdaQueryWrapper<Activity> qw = new LambdaQueryWrapper<Activity>()
                .orderByDesc(Activity::getStartTime);
        if (status != null && !status.isBlank()) {
            qw.eq(Activity::getStatus, status);
        }
        Page<Activity> p = activityMapper.selectPage(new Page<>(page, size), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("enroll:read");
        return toVo(requireActivity(id));
    }

    public Map<String, Object> create(ActivitySaveRequest req) {
        adminPermissionService.require("admin:super");
        validateTitle(req);
        Activity activity = fromRequest(new Activity(), req);
        activity.setStatus("draft");
        activity.setEnrolledCount(0);
        activity.setCreatedBy(AdminContext.getAdminId());
        activityMapper.insert(activity);
        return toVo(activityMapper.selectById(activity.getId()));
    }

    public Map<String, Object> update(Long id, ActivitySaveRequest req) {
        adminPermissionService.require("admin:super");
        Activity activity = requireActivity(id);
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(400, "已取消的活动不可编辑");
        }
        fromRequest(activity, req);
        activityMapper.updateById(activity);
        return toVo(activityMapper.selectById(id));
    }

    @Transactional
    public Map<String, Object> publish(Long id) {
        adminPermissionService.require("admin:super");
        Activity activity = requireActivity(id);
        if ("published".equals(activity.getStatus())) {
            throw new BusinessException(400, "活动已发布");
        }
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(400, "已取消的活动不可发布");
        }
        if (activity.getTitle() == null || activity.getTitle().isBlank()) {
            throw new BusinessException(400, "请填写活动标题");
        }
        activity.setStatus("published");
        activityMapper.updateById(activity);
        return toVo(activityMapper.selectById(id));
    }

    @Transactional
    public Map<String, Object> cancel(Long id) {
        adminPermissionService.require("admin:super");
        Activity activity = requireActivity(id);
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(400, "活动已取消");
        }
        activity.setStatus("cancelled");
        activityMapper.updateById(activity);
        return toVo(activityMapper.selectById(id));
    }

    private Activity requireActivity(Long id) {
        Activity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BusinessException(404, "活动不存在");
        }
        return activity;
    }

    private void validateTitle(ActivitySaveRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new BusinessException(400, "活动标题不能为空");
        }
    }

    private Activity fromRequest(Activity activity, ActivitySaveRequest req) {
        if (req.getTitle() != null) {
            activity.setTitle(req.getTitle());
        }
        if (req.getCover() != null) {
            activity.setCover(req.getCover());
        }
        if (req.getCoverFitMode() != null) {
            activity.setCoverFitMode(com.shuyuan.backend.util.CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getIntro() != null) {
            activity.setIntro(req.getIntro());
        }
        if (req.getLocation() != null) {
            activity.setLocation(req.getLocation());
        }
        if (req.getStartTime() != null) {
            activity.setStartTime(FormatUtils.parseDateTime(req.getStartTime()));
        }
        if (req.getEndTime() != null) {
            activity.setEndTime(FormatUtils.parseDateTime(req.getEndTime()));
        }
        if (req.getEnrollStartTime() != null) {
            activity.setEnrollStartTime(FormatUtils.parseDateTime(req.getEnrollStartTime()));
        }
        if (req.getEnrollEndTime() != null) {
            activity.setEnrollEndTime(FormatUtils.parseDateTime(req.getEnrollEndTime()));
        }
        if (req.getQuota() != null) {
            activity.setQuota(req.getQuota());
        }
        if (req.getNeedReview() != null) {
            activity.setNeedReview(req.getNeedReview());
        }
        if (activity.getQuota() == null) {
            activity.setQuota(0);
        }
        if (activity.getNeedReview() == null) {
            activity.setNeedReview(0);
        }
        return activity;
    }

    private Map<String, Object> toVo(Activity a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("title", a.getTitle());
        m.put("cover", a.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(a.getCoverFitMode()));
        m.put("intro", a.getIntro());
        m.put("location", a.getLocation());
        m.put("startTime", FormatUtils.formatDateTime(a.getStartTime()));
        m.put("endTime", FormatUtils.formatDateTime(a.getEndTime()));
        m.put("enrollStartTime", FormatUtils.formatDateTime(a.getEnrollStartTime()));
        m.put("enrollEndTime", FormatUtils.formatDateTime(a.getEnrollEndTime()));
        m.put("quota", a.getQuota());
        m.put("enrolledCount", a.getEnrolledCount());
        m.put("status", a.getStatus());
        m.put("needReview", a.getNeedReview() != null && a.getNeedReview() == 1);
        m.put("full", a.getQuota() != null && a.getQuota() > 0
                && a.getEnrolledCount() != null && a.getEnrolledCount() >= a.getQuota());
        return m;
    }
}
