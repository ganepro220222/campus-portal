package com.shuyuan.backend.config;

import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.service.RateLimitService;
import com.shuyuan.backend.util.ClientIpResolver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 失败退还的边界。
 *
 * <p>计数是在 preHandle 预扣的，所以「后端自己没干成」的失败也会白吃用户一次额度——
 * 后台 AI 润色遇到上游异常直接 500 就是最典型的一例。这里锁死两件事：
 * 5xx 必须退，4xx 必须**不**退（退了就等于允许拿非法请求无限敲接口，限流形同虚设）。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitInterceptorRefundTest {

    private static final String AI_URI = "/api/v1/ai/chat/sessions/12/messages";
    private static final String POLISH_URI = "/api/v1/admin/ai/polish";
    private static final String AI_KEY = "ratelimit:ai:u:5:2026-08-27";

    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private ClientIpResolver clientIpResolver;

    private ShuyuanProperties properties;
    private RateLimitInterceptor interceptor;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getRateLimit().setEnabled(true);
        interceptor = new RateLimitInterceptor(rateLimitService, properties, clientIpResolver);
        when(clientIpResolver.resolve(any())).thenReturn("127.0.0.1");
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
        AdminContext.clear();
    }

    private MockHttpServletRequest aiRequest() {
        MemberContext.setMemberId(5L);
        when(rateLimitService.checkUserCalendarDay(eq(RateLimitService.SCENE_AI), eq(5L), anyInt()))
                .thenReturn(AI_KEY);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", AI_URI);
        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        return request;
    }

    private void complete(MockHttpServletRequest request, int status, Exception ex) {
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(status);
        interceptor.afterCompletion(request, response, new Object(), ex);
    }

    // ---------- 该退的 ----------

    @Test
    void 服务端故障退还次数() {
        complete(aiRequest(), 500, null);
        verify(rateLimitService).refundKey(AI_KEY);
    }

    /** 上游没返回可用内容（AdminAiPolishService 抛 502）：钱花了但用户什么也没拿到 */
    @Test
    void 上游无有效返回退还次数() {
        complete(aiRequest(), 502, null);
        verify(rateLimitService).refundKey(AI_KEY);
    }

    @Test
    void 异常漏到容器也退还次数() {
        complete(aiRequest(), 200, new IllegalStateException("boom"));
        verify(rateLimitService).refundKey(AI_KEY);
    }

    // ---------- 不该退的 ----------

    @Test
    void 成功不退还() {
        complete(aiRequest(), 200, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    /** 400 含「问题包含不当内容」：退了就能拿敏感词无限刷这个接口 */
    @Test
    void 入参与内容安全失败不退还() {
        complete(aiRequest(), 400, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    @Test
    void 未登录与越权不退还() {
        complete(aiRequest(), 401, null);
        complete(aiRequest(), 403, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    @Test
    void 会话不存在不退还() {
        complete(aiRequest(), 404, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    @Test
    void 超限本身不退还() {
        complete(aiRequest(), 429, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    // ---------- 记账本身 ----------

    @Test
    void 没计数的请求不会触发退还也不会报错() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/news");
        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        assertNull(request.getAttribute(RateLimitInterceptor.ATTR_OCCUPIED_KEYS));

        complete(request, 500, null);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    /** 限流关闭时 check 返回 null，不能把 null 记进账本 */
    @Test
    void 限流关闭时不记账() {
        properties.getRateLimit().setEnabled(false);
        MemberContext.setMemberId(5L);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", AI_URI);
        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertNull(request.getAttribute(RateLimitInterceptor.ATTR_OCCUPIED_KEYS));
    }

    /** 退还只能发生一次：afterCompletion 走完就把账本清掉 */
    @Test
    void 退还后账本清空不会重复退() {
        MockHttpServletRequest request = aiRequest();
        complete(request, 500, null);
        complete(request, 500, null);

        verify(rateLimitService, org.mockito.Mockito.times(1)).refundKey(AI_KEY);
    }

    // ---------- 后台 AI 辅助按自然日 ----------

    /**
     * 原来是 Duration.ofDays(1) 的滚动窗口，从当天第一次调用起算：
     * 昨天上午十点用满，要等到今天上午十点才恢复，而提示却说「明天再来」。
     */
    @Test
    void 后台AI辅助按自然日结算且用配置额度() {
        AdminContext.set(7L, 1L, java.util.Set.of("news:write"));
        properties.getAi().setDailyLimit(60);
        when(rateLimitService.checkUserCalendarDay(eq(RateLimitService.SCENE_AI_POLISH), eq(7L), eq(60)))
                .thenReturn("ratelimit:ai-polish:u:7:2026-08-27");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", POLISH_URI);
        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        verify(rateLimitService).checkUserCalendarDay(RateLimitService.SCENE_AI_POLISH, 7L, 60);
        verify(rateLimitService, never()).checkUser(anyString(), any(), anyInt(), any());

        complete(request, 500, null);
        verify(rateLimitService).refundKey("ratelimit:ai-polish:u:7:2026-08-27");
    }

    @Test
    void 后台AI辅助未登录时不计数() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", POLISH_URI);
        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertNull(request.getAttribute(RateLimitInterceptor.ATTR_OCCUPIED_KEYS));
    }

    @Test
    void 小程序问答仍按自然日且用学生端额度() {
        properties.getRateLimit().setAiPerDay(20);
        MockHttpServletRequest request = aiRequest();

        verify(rateLimitService).checkUserCalendarDay(RateLimitService.SCENE_AI, 5L, 20);
        assertEquals(java.util.List.of(AI_KEY),
                request.getAttribute(RateLimitInterceptor.ATTR_OCCUPIED_KEYS));
    }
}
