package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityMapper activityMapper;
    private final EnrollService enrollService;
    private final EventLogService eventLogService;

    public PageResult<Map<String, Object>> list(int page, int size) {
        Page<Activity> p = activityMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Activity>()
                        .eq(Activity::getStatus, "published")
                        .orderByDesc(Activity::getStartTime));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toListVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        Activity activity = activityMapper.selectById(id);
        if (activity == null || !"published".equals(activity.getStatus())) {
            throw new BusinessException(404, "活动不存在");
        }

        Long memberId = MemberContext.getMemberId();
        Enroll enroll = enrollService.findMemberEnroll(memberId, id);

        Map<String, Object> m = new HashMap<>();
        m.put("id", activity.getId());
        m.put("title", activity.getTitle());
        m.put("cover", activity.getCover());
        m.put("intro", activity.getIntro());
        m.put("location", activity.getLocation());
        m.put("startTime", FormatUtils.formatDateTime(activity.getStartTime()));
        m.put("endTime", FormatUtils.formatDateTime(activity.getEndTime()));
        m.put("enrollStartTime", FormatUtils.formatDateTime(activity.getEnrollStartTime()));
        m.put("enrollEndTime", FormatUtils.formatDateTime(activity.getEnrollEndTime()));
        m.put("quota", activity.getQuota());
        m.put("enrolledCount", activity.getEnrolledCount());
        m.put("needReview", activity.getNeedReview() != null && activity.getNeedReview() == 1);
        m.put("tag", activity.getIntro() != null && activity.getIntro().length() <= 6 ? activity.getIntro() : "活动");
        m.put("canEnroll", enrollService.isEnrollOpen(activity)
                && (enroll == null || "cancelled".equals(enroll.getStatus()) || "rejected".equals(enroll.getStatus())));
        m.put("full", activity.getQuota() != null && activity.getQuota() > 0
                && activity.getEnrolledCount() != null
                && activity.getEnrolledCount() >= activity.getQuota());

        if (enroll != null && !"cancelled".equals(enroll.getStatus())) {
            m.put("enrollStatus", enroll.getStatus());
            m.put("enrollId", enroll.getId());
            m.put("voucherCode", enroll.getVoucherCode());
        } else {
            m.put("enrollStatus", "none");
        }
        eventLogService.record("view", "activity", id);
        return m;
    }

    private Map<String, Object> toListVo(Activity a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("title", a.getTitle());
        m.put("cover", a.getCover());
        m.put("location", a.getLocation());
        m.put("startTime", FormatUtils.formatDateTime(a.getStartTime()));
        m.put("enrolledCount", a.getEnrolledCount());
        m.put("quota", a.getQuota());
        m.put("tag", a.getIntro() != null && a.getIntro().length() <= 6 ? a.getIntro() : "活动");
        return m;
    }
}
