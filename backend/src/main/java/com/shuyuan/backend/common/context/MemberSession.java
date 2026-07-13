package com.shuyuan.backend.common.context;

/**
 * 小程序会员请求会话（拦截器解析 token 后写入线程上下文）
 */
public record MemberSession(Long memberId, boolean mustChangePassword) {}
