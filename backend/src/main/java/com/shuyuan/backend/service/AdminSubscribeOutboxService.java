package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.EnrollMapper;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 后台「通知发送记录」。
 *
 * <p>页面是给老师看的，不是给开发看的，所以这里要把「哪个活动、发给谁、为什么没发出去」
 * 三件事补齐：活动名称藏在 payload_json 里，接收人要按 member 查姓名/学号，
 * 失败原因则统一成一个 reasonCode 交给前端翻译成人话与处置指引。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSubscribeOutboxService {

    /** 单页上限：这张表可能很大，别让 ?size=99999 把库拖垮 */
    static final int MAX_PAGE_SIZE = 100;
    /** 虚拟状态：失败 + 已跳过，页面默认视图 */
    static final String FILTER_ATTENTION = "attention";

    private final SubscribeOutboxMapper outboxMapper;
    private final ActivityMapper activityMapper;
    private final EnrollMapper enrollMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final AdminPermissionService adminPermissionService;
    private final ObjectMapper objectMapper;

    public PageResult<Map<String, Object>> list(int page, int size, String status) {
        adminPermissionService.require("admin:super");
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 20 : Math.min(size, MAX_PAGE_SIZE);
        LambdaQueryWrapper<SubscribeOutbox> qw = new LambdaQueryWrapper<SubscribeOutbox>()
                .orderByDesc(SubscribeOutbox::getCreateTime);
        applyStatusFilter(qw, status);
        Page<SubscribeOutbox> p = outboxMapper.selectPage(new Page<>(safePage, safeSize), qw);
        Map<Long, String> names = resolveReceivers(p.getRecords());
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(row -> toVo(row, names))
                .toList();
        return new PageResult<>(records, p.getTotal(), safePage, safeSize);
    }

    /**
     * 状态筛选。
     *
     * <p>额外支持一个虚拟值 {@value #FILTER_ATTENTION}：等价于「失败 + 已跳过」。
     * 页面默认就用它——老师打开这个页面是因为「有人没收到通知」，
     * 「已发送」那几千条对他没有任何信息量，混在一起反而把异常淹没了。
     */
    static void applyStatusFilter(LambdaQueryWrapper<SubscribeOutbox> qw, String status) {
        if (status == null || status.isBlank()) {
            return;
        }
        String s = status.trim();
        if (FILTER_ATTENTION.equals(s)) {
            qw.in(SubscribeOutbox::getStatus,
                    SubscribeOutboxService.STATUS_FAILED, SubscribeOutboxService.STATUS_SKIPPED);
            return;
        }
        qw.eq(SubscribeOutbox::getStatus, s);
    }

    /** 重新入队一条失败/跳过的记录；worker 下一轮会重发 */
    public void retry(Long id) {
        adminPermissionService.require("admin:super");
        if (id == null) {
            throw new BusinessException(400, "缺少记录 ID");
        }
        SubscribeOutbox row = outboxMapper.selectById(id);
        if (row == null) {
            throw new BusinessException(404, "记录不存在");
        }
        String payloadJson = refreshPayloadJsonForRetry(row);
        if (outboxMapper.requeueForRetry(id, payloadJson) == 0) {
            throw new BusinessException(400, "只有「发送失败」和「已跳过」的记录可以重新发送");
        }
        log.info("[subscribe-outbox] 后台重新入队 id={} 原状态={}", id, row.getStatus());
    }

    /**
     * 重试前用当前活动/报名数据刷新 payload，避免「补时间 → 重发」仍带着空的 activityStartTime。
     * 解析失败或无 activityId 时保留原 JSON，其它终态错误仍可原样重试。
     */
    private String refreshPayloadJsonForRetry(SubscribeOutbox row) {
        String original = row.getPayloadJson();
        SubscribeOutboxPayload payload = parsePayload(original);
        if (payload == null || payload.getActivityId() == null) {
            return original;
        }
        Activity activity = activityMapper.selectById(payload.getActivityId());
        if (activity == null) {
            throw new BusinessException(400, "关联活动不存在，无法补全发送内容");
        }
        Enroll enroll = payload.getEnrollId() != null ? enrollMapper.selectById(payload.getEnrollId()) : null;
        try {
            return objectMapper.writeValueAsString(SubscribeOutboxService.buildPayload(activity, enroll));
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "序列化发送内容失败");
        }
    }

    private SubscribeOutboxPayload parsePayload(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, SubscribeOutboxPayload.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 一次性把本页所有接收人查出来，避免逐行两次查询（20 行 = 40 次）。
     * 姓名优先取实名档案，没有就退到学号，再没有就用 ID 兜底——总之不能给老师看空白。
     */
    private Map<Long, String> resolveReceivers(List<SubscribeOutbox> rows) {
        Set<Long> ids = rows.stream()
                .map(SubscribeOutbox::getMemberId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> realNames = memberProfileMapper
                .selectList(new LambdaQueryWrapper<MemberProfile>().in(MemberProfile::getMemberId, ids))
                .stream()
                .filter(pf -> pf.getRealName() != null && !pf.getRealName().isBlank())
                .collect(Collectors.toMap(MemberProfile::getMemberId, MemberProfile::getRealName, (a, b) -> a));
        Map<Long, String> studentNos = memberAccountMapper
                .selectList(new LambdaQueryWrapper<MemberAccount>().in(MemberAccount::getMemberId, ids))
                .stream()
                .filter(ac -> ac.getStudentNo() != null && !ac.getStudentNo().isBlank())
                .collect(Collectors.toMap(MemberAccount::getMemberId, MemberAccount::getStudentNo, (a, b) -> a));

        Map<Long, String> out = new HashMap<>();
        for (Long id : ids) {
            String name = realNames.get(id);
            String no = studentNos.get(id);
            if (name != null && no != null) {
                out.put(id, name + "（" + no + "）");
            } else if (name != null) {
                out.put(id, name);
            } else if (no != null) {
                out.put(id, no);
            } else {
                out.put(id, "用户 " + id);
            }
        }
        return out;
    }

    private Map<String, Object> toVo(SubscribeOutbox row, Map<Long, String> receivers) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", row.getId());
        m.put("memberId", row.getMemberId());
        m.put("receiver", receivers.getOrDefault(row.getMemberId(), ""));
        m.put("scene", row.getScene());
        m.put("status", row.getStatus());
        m.put("attemptCount", row.getAttemptCount());
        m.put("lastError", row.getLastError());
        m.put("reasonCode", reasonCode(row));
        m.put("activityTitle", activityTitle(row.getPayloadJson()));
        m.put("createTime", FormatUtils.formatDateTime(row.getCreateTime()));
        m.put("updateTime", FormatUtils.formatDateTime(row.getUpdateTime()));
        m.put("sentAt", FormatUtils.formatDateTime(row.getSentAt()));
        m.put("nextRetryAt", FormatUtils.formatDateTime(row.getNextRetryAt()));
        m.put("canRetry", SubscribeOutboxService.STATUS_FAILED.equals(row.getStatus())
                || SubscribeOutboxService.STATUS_SKIPPED.equals(row.getStatus()));
        return m;
    }

    /** 活动名称存在 payload 里；解析不出来不算错误，返回空串让前端显示占位 */
    private String activityTitle(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return "";
        }
        try {
            SubscribeOutboxPayload payload = objectMapper.readValue(payloadJson, SubscribeOutboxPayload.class);
            return payload.getActivityTitle() != null ? payload.getActivityTitle() : "";
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * 把 last_error 归一成一个稳定的 code，前端据此给出人话与处置指引。
     *
     * <p>last_error 现在是混的：跳过时写的是 SubscribeSendOutcome 的枚举名，
     * 失败时写的是中文短句。这里统一收口，原文仍通过 lastError 字段保留供追查。
     */
    static String reasonCode(SubscribeOutbox row) {
        String err = row.getLastError();
        if (err == null || err.isBlank()) {
            return "";
        }
        for (SubscribeSendOutcome outcome : SubscribeSendOutcome.values()) {
            if (err.startsWith(outcome.name())) {
                return outcome.name();
            }
        }
        if (err.startsWith("超过最大重试次数")) {
            return "MAX_ATTEMPTS";
        }
        if (err.startsWith("payload 解析失败")) {
            return "BAD_PAYLOAD";
        }
        if (err.startsWith("微信返回不可重试错误")) {
            return "WX_REJECTED";
        }
        return "OTHER";
    }

    /** 供测试与前端对齐：所有可能的 reasonCode */
    static Set<String> knownReasonCodes() {
        Set<String> codes = new LinkedHashSet<>();
        for (SubscribeSendOutcome outcome : SubscribeSendOutcome.values()) {
            codes.add(outcome.name());
        }
        codes.add("MAX_ATTEMPTS");
        codes.add("BAD_PAYLOAD");
        codes.add("WX_REJECTED");
        codes.add("OTHER");
        return codes;
    }
}
