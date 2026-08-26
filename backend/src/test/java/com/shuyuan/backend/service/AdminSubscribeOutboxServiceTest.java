package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.entity.SubscribeOutbox;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminSubscribeOutboxServiceTest {

    private static SubscribeOutbox withError(String err) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setLastError(err);
        return row;
    }

    @Test
    void reasonCode_识别跳过类枚举名() {
        assertEquals("SKIPPED_NO_AUTH", AdminSubscribeOutboxService.reasonCode(withError("SKIPPED_NO_AUTH")));
        assertEquals("SKIPPED_NO_TEMPLATE", AdminSubscribeOutboxService.reasonCode(withError("SKIPPED_NO_TEMPLATE")));
        assertEquals("SKIPPED_INVALID_PAYLOAD", AdminSubscribeOutboxService.reasonCode(withError("SKIPPED_INVALID_PAYLOAD")));
        assertEquals("SKIPPED_NO_OPENID", AdminSubscribeOutboxService.reasonCode(withError("SKIPPED_NO_OPENID")));
    }

    @Test
    void reasonCode_识别中文短句() {
        assertEquals("MAX_ATTEMPTS", AdminSubscribeOutboxService.reasonCode(withError("超过最大重试次数")));
        assertEquals("BAD_PAYLOAD", AdminSubscribeOutboxService.reasonCode(withError("payload 解析失败")));
        assertEquals("WX_REJECTED", AdminSubscribeOutboxService.reasonCode(withError("微信返回不可重试错误")));
    }

    @Test
    void reasonCode_带后缀仍能识别() {
        // scheduleRetry 会把原因截断后拼上「(已达最大重试)」
        assertEquals("WX_REJECTED", AdminSubscribeOutboxService.reasonCode(withError("微信返回不可重试错误 (已达最大重试)")));
        assertEquals("MAX_ATTEMPTS", AdminSubscribeOutboxService.reasonCode(withError("发送失败，等待重试 (已达最大重试)")));
    }

    @Test
    void reasonCode_超过最大重试次数带详情前缀() {
        assertEquals("MAX_ATTEMPTS", AdminSubscribeOutboxService.reasonCode(withError("超过最大重试次数: 发送失败，等待重试")));
    }

    @Test
    void matchesAttentionFilter_排除未授权skipped() {
        assertTrue(AdminSubscribeOutboxService.matchesAttentionFilter(SubscribeOutboxService.STATUS_FAILED, null));
        assertTrue(AdminSubscribeOutboxService.matchesAttentionFilter(
                SubscribeOutboxService.STATUS_SKIPPED, null));
        assertTrue(AdminSubscribeOutboxService.matchesAttentionFilter(
                SubscribeOutboxService.STATUS_SKIPPED, "SKIPPED_NO_TEMPLATE"));
        assertTrue(AdminSubscribeOutboxService.matchesAttentionFilter(
                SubscribeOutboxService.STATUS_SKIPPED, "SKIPPED_INVALID_PAYLOAD"));
        assertFalse(AdminSubscribeOutboxService.matchesAttentionFilter(
                SubscribeOutboxService.STATUS_SKIPPED, "SKIPPED_NO_AUTH"));
        assertFalse(AdminSubscribeOutboxService.matchesAttentionFilter(SubscribeOutboxService.STATUS_SENT, null));
    }

    @Test
    void canRetry_排除未授权与坏payload() {
        SubscribeOutbox noAuth = rowWith(SubscribeOutboxService.STATUS_SKIPPED, "SKIPPED_NO_AUTH");
        SubscribeOutbox badPayload = rowWith(SubscribeOutboxService.STATUS_FAILED, "payload 解析失败");
        SubscribeOutbox fixable = rowWith(SubscribeOutboxService.STATUS_SKIPPED, "SKIPPED_INVALID_PAYLOAD");

        assertFalse(AdminSubscribeOutboxService.canRetry(noAuth));
        assertFalse(AdminSubscribeOutboxService.canRetry(badPayload));
        assertTrue(AdminSubscribeOutboxService.canRetry(fixable));
    }

    private static SubscribeOutbox rowWith(String status, String lastError) {
        SubscribeOutbox row = new SubscribeOutbox();
        row.setStatus(status);
        row.setLastError(lastError);
        return row;
    }

    @Test
    void reasonCode_空与未知() {
        assertEquals("", AdminSubscribeOutboxService.reasonCode(withError(null)));
        assertEquals("", AdminSubscribeOutboxService.reasonCode(withError("   ")));
        assertEquals("OTHER", AdminSubscribeOutboxService.reasonCode(withError("connection reset by peer")));
    }

    /** 前端的文案表按这些 code 写死；新增枚举时这条会提醒同步前端 */
    @Test
    void knownReasonCodes_覆盖全部投递结果加四个补充码() {
        Set<String> codes = AdminSubscribeOutboxService.knownReasonCodes();
        for (SubscribeSendOutcome outcome : SubscribeSendOutcome.values()) {
            assertTrue(codes.contains(outcome.name()), "缺少 " + outcome.name());
        }
        assertTrue(codes.contains("MAX_ATTEMPTS"));
        assertTrue(codes.contains("BAD_PAYLOAD"));
        assertTrue(codes.contains("WX_REJECTED"));
        assertTrue(codes.contains("OTHER"));
        assertEquals(SubscribeSendOutcome.values().length + 4, codes.size());
    }

    @Test
    void 单页上限是一百() {
        assertEquals(100, AdminSubscribeOutboxService.MAX_PAGE_SIZE);
    }

    /** payload 里的活动名称必须能被解析出来——这是页面上老师唯一认得的那一列 */
    @Test
    void payload_能解析出活动名称() throws Exception {
        ObjectMapper om = new ObjectMapper();
        String json = om.writeValueAsString(java.util.Map.of(
                "activityId", 12, "activityTitle", "非遗研学讲座", "activityStartTime", "2026-09-01 14:00"));
        var payload = om.readValue(json, com.shuyuan.backend.dto.SubscribeOutboxPayload.class);
        assertEquals("非遗研学讲座", payload.getActivityTitle());
    }
}
