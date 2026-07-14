package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.SubscribeOutboxPayload;
import com.shuyuan.backend.dto.SubscribeRecordRequest;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Enroll;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberSubscribeRecord;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberSubscribeRecordMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信订阅消息授权记录与发送（《详细开发实施方案》活动报名 §订阅消息）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscribeService {

    public static final String SCENE_ENROLL_SUCCESS = "enroll_success";
    public static final String SCENE_ENROLL_APPROVED = "enroll_approved";
    public static final String SCENE_ACTIVITY_REMIND = "activity_remind";

    private static final String SEND_URL =
            "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=";

    private final MemberSubscribeRecordMapper subscribeRecordMapper;
    private final MemberMapper memberMapper;
    private final ShuyuanProperties properties;
    private final WxAccessTokenService accessTokenService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** 小程序端上报 wx.requestSubscribeMessage 结果 */
    @Transactional
    public void recordAuthorization(Long memberId, SubscribeRecordRequest req) {
        if (memberId == null || req == null || !Boolean.TRUE.equals(req.getAccepted())) {
            return;
        }
        String scene = req.getScene().trim();
        String templateId = req.getTemplateId().trim();
        MemberSubscribeRecord existing = subscribeRecordMapper.selectOne(
                new LambdaQueryWrapper<MemberSubscribeRecord>()
                        .eq(MemberSubscribeRecord::getMemberId, memberId)
                        .eq(MemberSubscribeRecord::getScene, scene)
                        .last("LIMIT 1"));
        if (existing != null) {
            existing.setTemplateId(templateId);
            existing.setAvailableCount((existing.getAvailableCount() != null ? existing.getAvailableCount() : 0) + 1);
            existing.setAuthorizedAt(LocalDateTime.now());
            subscribeRecordMapper.updateById(existing);
        } else {
            MemberSubscribeRecord record = new MemberSubscribeRecord();
            record.setMemberId(memberId);
            record.setScene(scene);
            record.setTemplateId(templateId);
            record.setAvailableCount(1);
            record.setAuthorizedAt(LocalDateTime.now());
            subscribeRecordMapper.insert(record);
        }
    }

    /** 报名成功/提交后发送（需用户事先授权 enroll_success） */
    public void sendEnrollSuccess(Long memberId, Activity activity, Enroll enroll) {
        if (activity == null || enroll == null) {
            return;
        }
        deliverForScene(memberId, SCENE_ENROLL_SUCCESS, toPayload(activity, enroll));
    }

    /** 审核通过后发送 */
    public void sendEnrollApproved(Long memberId, Activity activity, Enroll enroll) {
        if (activity == null) {
            return;
        }
        deliverForScene(memberId, SCENE_ENROLL_APPROVED, toPayload(activity, enroll));
    }

    /** outbox worker 入口：按场景投递并返回结果 */
    public SubscribeSendOutcome deliverForScene(Long memberId, String scene, SubscribeOutboxPayload payload) {
        if (memberId == null || payload == null || payload.getActivityId() == null) {
            return SubscribeSendOutcome.PERMANENT_FAILURE;
        }
        String page = "packageC/activity/detail?id=" + payload.getActivityId();
        return deliver(memberId, scene, page, buildKeywordData(scene, payload));
    }

    private SubscribeOutboxPayload toPayload(Activity activity, Enroll enroll) {
        SubscribeOutboxPayload payload = new SubscribeOutboxPayload();
        payload.setActivityId(activity.getId());
        if (enroll != null) {
            payload.setEnrollId(enroll.getId());
            payload.setEnrollStatus(enroll.getStatus());
            payload.setVoucherCode(enroll.getVoucherCode());
        }
        payload.setActivityTitle(activity.getTitle());
        payload.setActivityStartTime(FormatUtils.formatDateTime(activity.getStartTime()));
        return payload;
    }

    private Map<String, String> buildKeywordData(String scene, SubscribeOutboxPayload payload) {
        Map<String, String> data = new HashMap<>();
        data.put("thing1", trim(payload.getActivityTitle(), 20));
        data.put("phrase2", trim(resolvePhrase2(scene, payload), 5));
        if (payload.getVoucherCode() != null && !payload.getVoucherCode().isBlank()) {
            data.put("character_string3", trim(payload.getVoucherCode(), 32));
        }
        data.put("time4", payload.getActivityStartTime() != null ? payload.getActivityStartTime() : "");
        return data;
    }

    private String resolvePhrase2(String scene, SubscribeOutboxPayload payload) {
        if (SCENE_ENROLL_APPROVED.equals(scene)) {
            return "审核通过";
        }
        if ("pending".equals(payload.getEnrollStatus())) {
            return "报名已提交";
        }
        return "报名成功";
    }

    /** 返回小程序 requestSubscribeMessage 所需模板 ID */
    public Map<String, String> templateIds() {
        ShuyuanProperties.Subscribe sub = properties.getSubscribe();
        Map<String, String> m = new HashMap<>();
        if (sub.getEnrollSuccessTemplateId() != null && !sub.getEnrollSuccessTemplateId().isBlank()) {
            m.put("enrollSuccess", sub.getEnrollSuccessTemplateId());
        }
        if (sub.getEnrollApprovedTemplateId() != null && !sub.getEnrollApprovedTemplateId().isBlank()) {
            m.put("enrollApproved", sub.getEnrollApprovedTemplateId());
        }
        if (sub.getActivityRemindTemplateId() != null && !sub.getActivityRemindTemplateId().isBlank()) {
            m.put("activityRemind", sub.getActivityRemindTemplateId());
        }
        return m;
    }

    private SubscribeSendOutcome deliver(Long memberId, String scene, String page, Map<String, String> keywordData) {
        MemberSubscribeRecord record = subscribeRecordMapper.selectOne(
                new LambdaQueryWrapper<MemberSubscribeRecord>()
                        .eq(MemberSubscribeRecord::getMemberId, memberId)
                        .eq(MemberSubscribeRecord::getScene, scene)
                        .gt(MemberSubscribeRecord::getAvailableCount, 0)
                        .last("LIMIT 1"));
        if (record == null) {
            log.debug("[subscribe] 无可用授权 memberId={} scene={}", memberId, scene);
            return SubscribeSendOutcome.SKIPPED_NO_AUTH;
        }
        Member member = memberMapper.selectById(memberId);
        if (member == null || member.getOpenid() == null || member.getOpenid().isBlank()) {
            return SubscribeSendOutcome.SKIPPED_NO_OPENID;
        }
        String templateId = resolveTemplateId(scene, record.getTemplateId());
        if (templateId == null || templateId.isBlank()) {
            log.debug("[subscribe] 未配置模板 scene={}", scene);
            return SubscribeSendOutcome.SKIPPED_NO_TEMPLATE;
        }
        try {
            DispatchResult result = dispatchSubscribeMessage(member.getOpenid(), templateId, page, keywordData);
            if (result.sent()) {
                subscribeRecordMapper.decrAvailable(record.getId());
                return SubscribeSendOutcome.SENT;
            }
            if (result.permanentFailure()) {
                return SubscribeSendOutcome.PERMANENT_FAILURE;
            }
            return SubscribeSendOutcome.RETRYABLE_FAILURE;
        } catch (Exception e) {
            log.warn("[subscribe] 发送失败 scene={} memberId={}: {}", scene, memberId, e.getMessage());
            return SubscribeSendOutcome.RETRYABLE_FAILURE;
        }
    }

    private record DispatchResult(boolean sent, boolean permanentFailure) {
        static DispatchResult success() {
            return new DispatchResult(true, false);
        }

        static DispatchResult retryable() {
            return new DispatchResult(false, false);
        }

        static DispatchResult permanent() {
            return new DispatchResult(false, true);
        }
    }

    private DispatchResult dispatchSubscribeMessage(String openid, String templateId, String page,
                                                    Map<String, String> keywordData) throws Exception {
        if (properties.getWx().isDevMode()) {
            log.info("[subscribe][dev] openid={} template={} page={} data={}",
                    openid, templateId, page, keywordData);
            return DispatchResult.success();
        }
        String token = accessTokenService.getAccessToken();
        if (token == null) {
            log.warn("[subscribe] 无 access_token，跳过发送");
            return DispatchResult.retryable();
        }
        ObjectNode body = objectMapper.createObjectNode();
        body.put("touser", openid);
        body.put("template_id", templateId);
        body.put("page", page);
        body.put("miniprogram_state", "formal");
        body.put("lang", "zh_CN");
        ObjectNode data = body.putObject("data");
        for (Map.Entry<String, String> e : keywordData.entrySet()) {
            if (e.getValue() == null) {
                continue;
            }
            ObjectNode item = data.putObject(e.getKey());
            item.put("value", e.getValue());
        }
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SEND_URL + token))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());
        int errcode = root.path("errcode").asInt(-1);
        if (errcode == 0) {
            return DispatchResult.success();
        }
        log.warn("[subscribe] 微信返回 errcode={} errmsg={}", errcode, root.path("errmsg").asText(""));
        if (isPermanentWxError(errcode)) {
            return DispatchResult.permanent();
        }
        return DispatchResult.retryable();
    }

    private boolean isPermanentWxError(int errcode) {
        return switch (errcode) {
            case 40003, 43101, 47003, 20001 -> true;
            default -> false;
        };
    }

    private String resolveTemplateId(String scene, String recordTemplateId) {
        if (recordTemplateId != null && !recordTemplateId.isBlank()) {
            return recordTemplateId;
        }
        ShuyuanProperties.Subscribe sub = properties.getSubscribe();
        return switch (scene) {
            case SCENE_ENROLL_SUCCESS -> sub.getEnrollSuccessTemplateId();
            case SCENE_ENROLL_APPROVED -> sub.getEnrollApprovedTemplateId();
            case SCENE_ACTIVITY_REMIND -> sub.getActivityRemindTemplateId();
            default -> null;
        };
    }

    private String trim(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        String s = value.trim();
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }
}
