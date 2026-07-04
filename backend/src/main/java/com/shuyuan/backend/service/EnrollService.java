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
    private final MessageMapper messageMapper;

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
        if (name.isBlank() || phone.isBlank()) {
            throw new BusinessException(400, "请先完善个人资料中的姓名和手机号");
        }

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
                update.setCollege(firstNonBlank(req.getCollege(), profile != null ? profile.getCollege() : null));
                update.setGrade(firstNonBlank(req.getGrade(), profile != null ? profile.getGrade() : null));
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
                enroll.setCollege(firstNonBlank(req.getCollege(), profile != null ? profile.getCollege() : null));
                enroll.setGrade(firstNonBlank(req.getGrade(), profile != null ? profile.getGrade() : null));
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

    /** 我的报名记录 */
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
        if ("cancelled".equals(enroll.getStatus()) || "rejected".equals(enroll.getStatus())) {
            throw new BusinessException(400, "当前报名状态无法查看凭证");
        }
        Activity activity = activityMapper.selectById(enroll.getActivityId());
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
        createMessage(memberId, title, content, "enroll", "activity", activity.getId());
    }

    private void createMessage(Long memberId, String title, String content, String type, String relatedType, Long relatedId) {
        Message msg = new Message();
        msg.setMemberId(memberId);
        msg.setTitle(title);
        msg.setContent(content);
        msg.setType(type);
        msg.setRelatedType(relatedType);
        msg.setRelatedId(relatedId);
        msg.setReadStatus(0);
        messageMapper.insert(msg);
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
}
