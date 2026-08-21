package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.EnrollRequest;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnrollService {

    private final ActivityMapper activityMapper;
    private final EnrollMapper enrollMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final EventLogService eventLogService;
    private final PointService pointService;
    private final MessageService messageService;
    private final SubscribeOutboxService subscribeOutboxService;

    /**
     * 提交报名（需登录且个人信息完整）
     */
    @Transactional
    public Map<String, Object> enroll(Long activityId, EnrollRequest req) {
        Long memberId = requireMemberId();
        Activity activity = requirePublishedActivity(activityId);
        assertCanEnroll(activity);

        Enroll existing = findMemberEnroll(memberId, activityId);
        if (existing != null && !"cancelled".equals(existing.getStatus()) && !"rejected".equals(existing.getStatus())) {
            throw new BusinessException(409, "您已报名该活动");
        }

        MemberProfile profile = memberProfileMapper.selectById(memberId);
        String name = pickName(req, profile);
        String phone = pickPhone(req, profile);
        validateEnrollIdentity(name, phone);
        String college = firstNonBlank(req.getCollege(), profile != null ? profile.getCollege() : null);
        String grade = firstNonBlank(req.getGrade(), profile != null ? profile.getGrade() : null);
        validateEnrollOptionalFields(college, grade);

        int affected = activityMapper.incrEnrolledCount(activityId);
        if (affected == 0) {
            throw new BusinessException(409, "名额已满");
        }

        String status = activity.getNeedReview() != null && activity.getNeedReview() == 1 ? "pending" : "approved";
        String voucherCode = generateVoucherCode();

        try {
            if (existing != null && ("cancelled".equals(existing.getStatus()) || "rejected".equals(existing.getStatus()))) {
                Enroll update = new Enroll();
                update.setId(existing.getId());
                update.setName(name);
                update.setPhone(phone);
                update.setCollege(college);
                update.setGrade(grade);
                update.setStatus(status);
                update.setVoucherCode(voucherCode);
                update.setRejectReason(null);
                enrollMapper.updateById(update);
                existing = enrollMapper.selectById(existing.getId());
            } else {
                Enroll enroll = new Enroll();
                enroll.setActivityId(activityId);
                enroll.setMemberId(memberId);
                enroll.setName(name);
                enroll.setPhone(phone);
                enroll.setCollege(college);
                enroll.setGrade(grade);
                enroll.setStatus(status);
                enroll.setVoucherCode(voucherCode);
                enrollMapper.insert(enroll);
                existing = enroll;
            }
        } catch (DuplicateKeyException e) {
            activityMapper.decrEnrolledCount(activityId);
            throw new BusinessException(409, "您已报名该活动");
        }

        createEnrollMessage(memberId, activity, existing);
        subscribeOutboxService.enqueueEnrollSuccess(memberId, activity, existing);
        eventLogService.record("enroll", "activity", activityId);
        pointService.award(memberId, "enroll_activity");
        return toEnrollVo(existing, activity);
    }

    /**
     * 取消报名（报名期内可取消，释放名额）
     */
    @Transactional
    public void cancelEnroll(Long activityId) {
        Long memberId = requireMemberId();
        Activity activity = requirePublishedActivity(activityId);
        Enroll enroll = findMemberEnroll(memberId, activityId);
        if (enroll == null || "cancelled".equals(enroll.getStatus())) {
            throw new BusinessException(404, "未找到有效报名记录");
        }
        if ("rejected".equals(enroll.getStatus())) {
            throw new BusinessException(400, "该报名已被拒绝，无法取消");
        }

        Enroll update = new Enroll();
        update.setId(enroll.getId());
        update.setStatus("cancelled");
        enrollMapper.updateById(update);
        activityMapper.decrEnrolledCount(activityId);

        createMessage(memberId, "报名已取消", "您已取消活动「" + activity.getTitle() + "」的报名。", "enroll", "activity", activityId);
    }

    /** 活动取消时，将待审/已通过报名同步取消并释放名额、通知学员 */
    @Transactional
    public void onActivityCancelled(Activity activity) {
        if (activity == null || activity.getId() == null) {
            return;
        }
        List<Enroll> active = enrollMapper.selectList(new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getActivityId, activity.getId())
                .in(Enroll::getStatus, List.of("pending", "approved")));
        for (Enroll enroll : active) {
            Enroll update = new Enroll();
            update.setId(enroll.getId());
            update.setStatus("cancelled");
            enrollMapper.updateById(update);
            activityMapper.decrEnrolledCount(activity.getId());
            createMessage(enroll.getMemberId(), "活动已取消",
                    "您报名的活动「" + activity.getTitle() + "」已取消，报名同步关闭。",
                    "enroll", "activity", activity.getId());
        }
    }

    /**
     * 我的报名记录（小程序个人中心）。
     * <p>产品口径：仅返回有效报名（pending / approved / rejected），排除 cancelled。
     * 用户主动取消或活动取消级联的报名不在此列表展示，改由站内消息告知。
     */
    public List<Map<String, Object>> myEnrolls() {
        Long memberId = requireMemberId();
        List<Enroll> list = enrollMapper.selectList(new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getMemberId, memberId)
                .ne(Enroll::getStatus, "cancelled")
                .orderByDesc(Enroll::getCreateTime));

        return list.stream().map(e -> {
            Activity activity = activityMapper.selectById(e.getActivityId());
            Map<String, Object> m = toEnrollVo(e, activity);
            if (activity != null) {
                m.put("activityTitle", activity.getTitle());
                m.put("activityCover", activity.getCover());
                m.put("activityStartTime", FormatUtils.formatDateTime(activity.getStartTime()));
                m.put("activityLocation", activity.getLocation());
                m.put("activityStatus", activity.getStatus());
                m.put("activityStatusLabel", activityStatusLabel(activity.getStatus()));
            }
            return m;
        }).toList();
    }

    /** 报名凭证 */
    public Map<String, Object> voucher(Long enrollId) {
        Long memberId = requireMemberId();
        Enroll enroll = enrollMapper.selectById(enrollId);
        if (enroll == null || !memberId.equals(enroll.getMemberId())) {
            throw new BusinessException(404, "凭证不存在");
        }
        if (!"approved".equals(enroll.getStatus())) {
            throw new BusinessException(400, "仅已通过报名可查看凭证");
        }
        Activity activity = activityMapper.selectById(enroll.getActivityId());
        if (activity == null || !"published".equals(activity.getStatus())) {
            throw new BusinessException(400, "活动已取消或不可用，无法查看凭证");
        }
        Map<String, Object> m = new HashMap<>();
        m.put("enrollId", enroll.getId());
        m.put("voucherCode", enroll.getVoucherCode());
        m.put("qrCodeUrl", enroll.getQrCodeUrl());
        m.put("status", enroll.getStatus());
        m.put("name", enroll.getName());
        m.put("phone", enroll.getPhone());
        m.put("createTime", FormatUtils.formatDateTime(enroll.getCreateTime()));
        if (activity != null) {
            m.put("activityTitle", activity.getTitle());
            m.put("activityStartTime", FormatUtils.formatDateTime(activity.getStartTime()));
            m.put("activityLocation", activity.getLocation());
        }
        return m;
    }

    /** 查询当前用户对某活动的报名状态 */
    public Enroll findMemberEnroll(Long memberId, Long activityId) {
        if (memberId == null) {
            return null;
        }
        return enrollMapper.selectOne(new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getMemberId, memberId)
                .eq(Enroll::getActivityId, activityId)
                .last("LIMIT 1"));
    }

    /** 判断活动当前是否开放报名 */
    public boolean isEnrollOpen(Activity activity) {
        if (activity == null || !"published".equals(activity.getStatus())) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (activity.getEnrollStartTime() != null && now.isBefore(activity.getEnrollStartTime())) {
            return false;
        }
        if (activity.getEnrollEndTime() != null && now.isAfter(activity.getEnrollEndTime())) {
            return false;
        }
        if (activity.getQuota() != null && activity.getQuota() > 0
                && activity.getEnrolledCount() != null
                && activity.getEnrolledCount() >= activity.getQuota()) {
            return false;
        }
        return true;
    }

    private void assertCanEnroll(Activity activity) {
        if (!"published".equals(activity.getStatus())) {
            throw new BusinessException(409, "当前活动不可报名");
        }
        LocalDateTime now = LocalDateTime.now();
        if (activity.getEnrollStartTime() != null && now.isBefore(activity.getEnrollStartTime())) {
            throw new BusinessException(409, "报名尚未开始");
        }
        if (activity.getEnrollEndTime() != null && now.isAfter(activity.getEnrollEndTime())) {
            throw new BusinessException(409, "报名已截止");
        }
    }

    private Activity requirePublishedActivity(Long activityId) {
        Activity activity = activityMapper.selectById(activityId);
        if (activity == null || !"published".equals(activity.getStatus())) {
            throw new BusinessException(404, "活动不存在");
        }
        return activity;
    }

    private Map<String, Object> toEnrollVo(Enroll enroll, Activity activity) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", enroll.getId());
        m.put("activityId", enroll.getActivityId());
        m.put("status", enroll.getStatus());
        m.put("voucherCode", enroll.getVoucherCode());
        m.put("name", enroll.getName());
        m.put("phone", enroll.getPhone());
        m.put("college", enroll.getCollege());
        m.put("grade", enroll.getGrade());
        m.put("createTime", FormatUtils.formatDateTime(enroll.getCreateTime()));
        if (activity != null) {
            m.put("activityTitle", activity.getTitle());
        }
        return m;
    }

    private void createEnrollMessage(Long memberId, Activity activity, Enroll enroll) {
        String title = "pending".equals(enroll.getStatus()) ? "报名已提交" : "报名成功";
        String content = "pending".equals(enroll.getStatus())
                ? "您已提交活动「" + activity.getTitle() + "」的报名，请等待审核。"
                : "您已成功报名活动「" + activity.getTitle() + "」，凭证码：" + enroll.getVoucherCode();
        messageService.create(memberId, title, content, "enroll", "activity", activity.getId());
    }

    private void createMessage(Long memberId, String title, String content, String type, String relatedType, Long relatedId) {
        messageService.create(memberId, title, content, type, relatedType, relatedId);
    }

    private String generateVoucherCode() {
        return "SY" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String pickName(EnrollRequest req, MemberProfile profile) {
        return firstNonBlank(req.getName(), profile != null ? profile.getRealName() : null);
    }

    private String pickPhone(EnrollRequest req, MemberProfile profile) {
        return firstNonBlank(req.getPhone(), profile != null ? profile.getPhone() : null);
    }

    private void validateEnrollIdentity(String name, String phone) {
        if (name.isBlank() || phone.isBlank()) {
            throw new BusinessException(400, "请先完善个人资料中的姓名和手机号");
        }
        if (name.length() > 32) {
            throw new BusinessException(400, "姓名过长");
        }
        if (!isValidCnMobile(phone)) {
            throw new BusinessException(400, "手机号格式不正确");
        }
    }

    private void validateEnrollOptionalFields(String college, String grade) {
        if (college != null && college.length() > 64) {
            throw new BusinessException(400, "学院名称过长");
        }
        if (grade != null && grade.length() > 16) {
            throw new BusinessException(400, "年级格式过长");
        }
    }

    private static boolean isValidCnMobile(String phone) {
        return phone != null && phone.matches("^1[3-9]\\d{9}$");
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return "";
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }

    private String activityStatusLabel(String status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case "cancelled" -> "活动已取消";
            case "published" -> "";
            default -> "";
        };
    }
}
