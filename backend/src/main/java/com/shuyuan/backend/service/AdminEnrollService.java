package com.shuyuan.backend.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.util.EnrollExportScope;
import com.shuyuan.backend.util.FormatUtils;
import com.shuyuan.backend.vo.EnrollExportRow;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminEnrollService {

    private final EnrollMapper enrollMapper;
    private final ActivityMapper activityMapper;
    private final AdminPermissionService adminPermissionService;
    private final MessageService messageService;
    private final SubscribeService subscribeService;

    public PageResult<Map<String, Object>> listByActivity(Long activityId, String status, int page, int size) {
        adminPermissionService.require("enroll:read");
        requireActivity(activityId);

        LambdaQueryWrapper<Enroll> qw = new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getActivityId, activityId)
                .ne(Enroll::getStatus, "cancelled")
                .orderByDesc(Enroll::getCreateTime);
        if (status != null && !status.isBlank()) {
            qw.eq(Enroll::getStatus, status);
        }

        Page<Enroll> p = enrollMapper.selectPage(new Page<>(page, size), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    @Transactional
    public Map<String, Object> approve(Long enrollId) {
        adminPermissionService.require("enroll:read");
        Enroll enroll = requireEnroll(enrollId);
        if (!"pending".equals(enroll.getStatus())) {
            throw new BusinessException(400, "仅待审核报名可通过");
        }
        Enroll update = new Enroll();
        update.setId(enrollId);
        update.setStatus("approved");
        enrollMapper.updateById(update);

        Activity activity = activityMapper.selectById(enroll.getActivityId());
        Enroll approved = enrollMapper.selectById(enrollId);
        notifyMember(enroll.getMemberId(), "报名审核通过",
                "您报名的活动「" + (activity != null ? activity.getTitle() : "") + "」已审核通过。",
                enroll.getActivityId());
        subscribeService.sendEnrollApproved(enroll.getMemberId(), activity, approved);

        return toVo(approved);
    }

    @Transactional
    public Map<String, Object> reject(Long enrollId, String reason) {
        adminPermissionService.require("enroll:read");
        Enroll enroll = requireEnroll(enrollId);
        if ("rejected".equals(enroll.getStatus()) || "cancelled".equals(enroll.getStatus())) {
            throw new BusinessException(400, "当前状态不可拒绝");
        }

        // 拒绝释放名额（pending / approved 均占过名额）
        if ("pending".equals(enroll.getStatus()) || "approved".equals(enroll.getStatus())) {
            activityMapper.decrEnrolledCount(enroll.getActivityId());
        }

        Enroll update = new Enroll();
        update.setId(enrollId);
        update.setStatus("rejected");
        update.setRejectReason(reason != null ? reason.trim() : "不符合报名条件");
        enrollMapper.updateById(update);

        Activity activity = activityMapper.selectById(enroll.getActivityId());
        String rejectMsg = update.getRejectReason();
        notifyMember(enroll.getMemberId(), "报名未通过",
                "您报名的活动「" + (activity != null ? activity.getTitle() : "") + "」未通过审核。原因：" + rejectMsg,
                enroll.getActivityId());

        return toVo(enrollMapper.selectById(enrollId));
    }

    /** 导出 Excel 报名名单 */
    public void exportExcel(Long activityId, String scope, HttpServletResponse response) throws IOException {
        adminPermissionService.require("enroll:export");
        Activity activity = requireActivity(activityId);
        String normalizedScope = EnrollExportScope.normalize(scope);

        LambdaQueryWrapper<Enroll> qw = new LambdaQueryWrapper<Enroll>()
                .eq(Enroll::getActivityId, activityId)
                .ne(Enroll::getStatus, "cancelled")
                .orderByDesc(Enroll::getCreateTime);
        if (EnrollExportScope.CHECKIN.equals(normalizedScope)) {
            qw.eq(Enroll::getStatus, "approved");
        }

        List<Enroll> list = enrollMapper.selectList(qw);

        List<EnrollExportRow> rows = list.stream().map(e -> {
            EnrollExportRow row = new EnrollExportRow();
            row.setName(e.getName());
            row.setPhone(e.getPhone());
            row.setCollege(e.getCollege());
            row.setGrade(e.getGrade());
            row.setStatusLabel(statusLabel(e.getStatus()));
            row.setVoucherCode(e.getVoucherCode());
            row.setCreateTime(FormatUtils.formatDateTime(e.getCreateTime()));
            return row;
        }).toList();

        String filePrefix = EnrollExportScope.CHECKIN.equals(normalizedScope)
                ? "活动报名_签到名单_"
                : "活动报名_审核台账_";
        String fileName = URLEncoder.encode(filePrefix + activity.getId() + ".xlsx", StandardCharsets.UTF_8)
                .replace("+", "%20");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + fileName);

        String sheetName = EnrollExportScope.CHECKIN.equals(normalizedScope) ? "签到名单" : "报名审核台账";
        EasyExcel.write(response.getOutputStream(), EnrollExportRow.class)
                .sheet(sheetName)
                .doWrite(rows);
    }

    private Activity requireActivity(Long activityId) {
        Activity activity = activityMapper.selectById(activityId);
        if (activity == null) {
            throw new BusinessException(404, "活动不存在");
        }
        return activity;
    }

    private Enroll requireEnroll(Long enrollId) {
        Enroll enroll = enrollMapper.selectById(enrollId);
        if (enroll == null) {
            throw new BusinessException(404, "报名记录不存在");
        }
        return enroll;
    }

    private void notifyMember(Long memberId, String title, String content, Long activityId) {
        messageService.create(memberId, title, content, "enroll", "activity", activityId);
    }

    private Map<String, Object> toVo(Enroll e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.getId());
        m.put("activityId", e.getActivityId());
        m.put("memberId", e.getMemberId());
        m.put("name", e.getName());
        m.put("phone", e.getPhone());
        m.put("college", e.getCollege());
        m.put("grade", e.getGrade());
        m.put("status", e.getStatus());
        m.put("statusLabel", statusLabel(e.getStatus()));
        m.put("voucherCode", e.getVoucherCode());
        m.put("rejectReason", e.getRejectReason());
        m.put("createTime", FormatUtils.formatDateTime(e.getCreateTime()));
        return m;
    }

    private String statusLabel(String status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case "pending" -> "待审核";
            case "approved" -> "已通过";
            case "rejected" -> "已拒绝";
            case "cancelled" -> "已取消";
            default -> status;
        };
    }
}
