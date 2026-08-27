package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.RateLimitInterceptor;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.service.ApiErrorMetrics;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 失败退还走真实的 MVC 管线。
 *
 * <p>单测里的 response.getStatus() 是我自己 set 进去的，证明不了真实时序：异常先被
 * GlobalExceptionHandler 接住并写状态码，afterCompletion 才跑——这个先后顺序要是反了，
 * 退还就永远看到 200，一次也不会触发，而所有单测照样绿。所以必须端到端跑一遍。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitRefundMvcTest {

    private static final String KEY = "ratelimit:ai:u:5:test";

    /** 按 code 抛 BusinessException，用来制造各档真实响应 */
    @RestController
    static class BoomController {
        @PostMapping("/api/v1/ai/chat/sessions/{id}/messages")
        public String boom(@PathVariable long id, @RequestParam int code) {
            if (code == 200) {
                return "ok";
            }
            if (code < 0) {
                // 没人显式处理的运行时异常，走 GlobalExceptionHandler 的 Exception 兜底
                throw new IllegalStateException("unexpected");
            }
            throw new BusinessException(code, "boom-" + code);
        }
    }

    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private ClientIpResolver clientIpResolver;
    @Mock
    private ApiErrorMetrics apiErrorMetrics;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ShuyuanProperties properties = new ShuyuanProperties();
        properties.getRateLimit().setEnabled(true);
        when(clientIpResolver.resolve(any())).thenReturn("127.0.0.1");
        when(rateLimitService.checkUserCalendarDay(eq(RateLimitService.SCENE_AI), eq(5L), anyInt()))
                .thenReturn(KEY);

        RateLimitInterceptor interceptor =
                new RateLimitInterceptor(rateLimitService, properties, clientIpResolver);

        mockMvc = MockMvcBuilders.standaloneSetup(new BoomController())
                .setControllerAdvice(new GlobalExceptionHandler(apiErrorMetrics))
                // 真实注册顺序里限流在鉴权之后；这里没有鉴权拦截器，直接把 memberId 塞进上下文
                .addInterceptors(new org.springframework.web.servlet.HandlerInterceptor() {
                    @Override
                    public boolean preHandle(jakarta.servlet.http.HttpServletRequest request,
                                             jakarta.servlet.http.HttpServletResponse response,
                                             Object handler) {
                        MemberContext.setMemberId(5L);
                        return true;
                    }
                }, interceptor)
                .build();
    }

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    private void call(int code, int expectedHttpStatus) throws Exception {
        mockMvc.perform(post("/api/v1/ai/chat/sessions/12/messages").param("code", String.valueOf(code)))
                .andExpect(status().is(expectedHttpStatus));
    }

    @Test
    void 服务端500在真实管线里会退还() throws Exception {
        call(500, 500);
        verify(rateLimitService).refundKey(KEY);
    }

    @Test
    void 上游502在真实管线里会退还() throws Exception {
        call(502, 502);
        verify(rateLimitService).refundKey(KEY);
    }

    @Test
    void 成功不退还() throws Exception {
        call(200, 200);
        verify(rateLimitService, never()).refundKey(anyString());
    }

    @Test
    void 各档4xx在真实管线里都不退还() throws Exception {
        for (int code : new int[]{400, 401, 403, 404, 429}) {
            call(code, code);
        }
        verify(rateLimitService, never()).refundKey(anyString());
    }

    /** 意料之外的运行时异常（如上游 SDK 抛错）由 Exception 兜底转成 500，同样该退 */
    @Test
    void 意料之外的运行时异常也会退还() throws Exception {
        call(-1, 500);
        verify(rateLimitService).refundKey(KEY);
    }
}
