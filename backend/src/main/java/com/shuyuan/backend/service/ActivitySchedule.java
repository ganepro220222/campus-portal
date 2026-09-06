package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;

import java.time.LocalDateTime;

/**
 * 活动报名窗口的统一口径，避免报名判断、详情 canEnroll、后台校验各写一套。
 *
 * <ul>
 *   <li>报名开始为空：发布后即可报名（无下界）</li>
 *   <li>报名截止为空：默认等于活动开始时间</li>
 *   <li>活动已经开始：不再接受新报名</li>
 * </ul>
 */
public final class ActivitySchedule {

    public static final String STATE_NOT_STARTED = "not_started";
    public static final String STATE_OPEN = "open";
    public static final String STATE_FULL = "full";
    public static final String STATE_CLOSED = "closed";
    public static final String STATE_STARTED = "started";
    /** 已开始但未填结束时间，不能断言仍在进行 */
    public static final String STATE_STARTED_NO_END = "started_no_end";
    public static final String STATE_ENDED = "ended";

    private ActivitySchedule() {}

    public static LocalDateTime effectiveEnrollStart(Activity activity) {
        return activity == null ? null : activity.getEnrollStartTime();
    }

    public static LocalDateTime effectiveEnrollEnd(Activity activity) {
        if (activity == null) {
            return null;
        }
        if (activity.getEnrollEndTime() != null) {
            return activity.getEnrollEndTime();
        }
        return activity.getStartTime();
    }

    /** 当前是否落在有效报名时段内（不含名额）。 */
    public static boolean isEnrollWindowOpen(Activity activity, LocalDateTime now) {
        if (activity == null || !"published".equals(activity.getStatus()) || now == null) {
            return false;
        }
        LocalDateTime enrollStart = effectiveEnrollStart(activity);
        if (enrollStart != null && now.isBefore(enrollStart)) {
            return false;
        }
        LocalDateTime enrollEnd = effectiveEnrollEnd(activity);
        if (enrollEnd != null && now.isAfter(enrollEnd)) {
            return false;
        }
        if (activity.getStartTime() != null && !now.isBefore(activity.getStartTime())) {
            return false;
        }
        return true;
    }

    public static String enrollClosedReason(Activity activity, LocalDateTime now) {
        if (activity == null || !"published".equals(activity.getStatus())) {
            return "当前活动不可报名";
        }
        LocalDateTime enrollStart = effectiveEnrollStart(activity);
        if (enrollStart != null && now.isBefore(enrollStart)) {
            return "报名尚未开始";
        }
        if (activity.getStartTime() != null && !now.isBefore(activity.getStartTime())) {
            return "活动已经开始，无法报名";
        }
        LocalDateTime enrollEnd = effectiveEnrollEnd(activity);
        if (enrollEnd != null && now.isAfter(enrollEnd)) {
            return "报名已截止";
        }
        return null;
    }

    public static void validate(Activity activity) {
        if (activity == null) {
            return;
        }
        LocalDateTime start = activity.getStartTime();
        LocalDateTime end = activity.getEndTime();
        LocalDateTime enrollStart = activity.getEnrollStartTime();
        LocalDateTime enrollEnd = activity.getEnrollEndTime();
        if (start != null && end != null && !end.isAfter(start)) {
            throw new BusinessException(400, "活动结束时间必须晚于开始时间");
        }
        if (enrollStart != null && enrollEnd != null && !enrollEnd.isAfter(enrollStart)) {
            throw new BusinessException(400, "报名截止时间必须晚于报名开始时间");
        }
        if (start != null && enrollStart != null && !enrollStart.isBefore(start)) {
            throw new BusinessException(400, "报名开始时间必须早于活动开始时间");
        }
        if (start != null && enrollEnd != null && enrollEnd.isAfter(start)) {
            throw new BusinessException(400, "报名截止时间不能晚于活动开始时间");
        }
    }

    public static boolean isQuotaFull(Activity activity) {
        return activity != null
                && activity.getQuota() != null && activity.getQuota() > 0
                && activity.getEnrolledCount() != null
                && activity.getEnrolledCount() >= activity.getQuota();
    }

    /**
     * 列表卡片状态。优先于名额：已结束 / 进行中 / 已开始 / 未开始 / 已截止，最后才是已满或开放。
     */
    public static String enrollListState(Activity activity, LocalDateTime now) {
        if (activity == null || !"published".equals(activity.getStatus()) || now == null) {
            return STATE_CLOSED;
        }
        if (activity.getEndTime() != null && !now.isBefore(activity.getEndTime())) {
            return STATE_ENDED;
        }
        if (activity.getStartTime() != null && !now.isBefore(activity.getStartTime())) {
            return activity.getEndTime() != null ? STATE_STARTED : STATE_STARTED_NO_END;
        }
        LocalDateTime enrollStart = effectiveEnrollStart(activity);
        if (enrollStart != null && now.isBefore(enrollStart)) {
            return STATE_NOT_STARTED;
        }
        LocalDateTime enrollEnd = effectiveEnrollEnd(activity);
        if (enrollEnd != null && now.isAfter(enrollEnd)) {
            return STATE_CLOSED;
        }
        if (isQuotaFull(activity)) {
            return STATE_FULL;
        }
        return STATE_OPEN;
    }

    public static String enrollListLabel(String state) {
        if (STATE_NOT_STARTED.equals(state)) {
            return "报名未开始";
        }
        if (STATE_OPEN.equals(state)) {
            return "立即报名";
        }
        if (STATE_FULL.equals(state)) {
            return "已满";
        }
        if (STATE_STARTED.equals(state)) {
            return "进行中";
        }
        if (STATE_STARTED_NO_END.equals(state)) {
            return "已开始";
        }
        if (STATE_ENDED.equals(state)) {
            return "已结束";
        }
        return "报名已截止";
    }
}
