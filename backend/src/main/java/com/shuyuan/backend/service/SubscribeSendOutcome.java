package com.shuyuan.backend.service;

/**
 * 订阅消息投递结果，供 outbox worker 决定重试或终态。
 */
public enum SubscribeSendOutcome {
    SENT,
    SKIPPED_NO_AUTH,
    SKIPPED_NO_OPENID,
    SKIPPED_NO_TEMPLATE,
    RETRYABLE_FAILURE,
    PERMANENT_FAILURE;

    public boolean isSkipped() {
        return this == SKIPPED_NO_AUTH || this == SKIPPED_NO_OPENID || this == SKIPPED_NO_TEMPLATE;
    }
}
