package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.RateLimitInterceptor;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.controller.api.MiniappToolController;
import com.shuyuan.backend.service.ApiErrorMetrics;
import com.shuyuan.backend.service.RateLimitService;
import com.shuyuan.backend.service.WxQrcodeService;
import com.shuyuan.backend.util.ClientIpResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WxacodeMvcTest {

    private MockMvc mockMvc;

    @Mock
    private WxQrcodeService wxQrcodeService;
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private ClientIpResolver clientIpResolver;

    private ShuyuanProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ShuyuanProperties();
        properties.getRateLimit().setEnabled(true);
        properties.getRateLimit().setWxacodePerMinute(30);
        RateLimitInterceptor rateLimitInterceptor = new RateLimitInterceptor(
                rateLimitService, properties, clientIpResolver);
        MiniappToolController controller = new MiniappToolController(wxQrcodeService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .addInterceptors(rateLimitInterceptor)
                .build();
    }

    @Test
    void wxacode_invalidPath_returns400() throws Exception {
        when(wxQrcodeService.getWxaCode(anyString(), anyInt()))
                .thenThrow(new BusinessException(400, "页面路径不在允许范围内"));

        mockMvc.perform(get("/api/v1/miniapp/wxacode").param("path", "evil/path"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void wxacode_rateLimited_returns429() throws Exception {
        when(clientIpResolver.resolve(any())).thenReturn("1.2.3.4");
        doThrow(new BusinessException(429, "操作过于频繁，请稍后再试"))
                .when(rateLimitService)
                .checkIp(eq("wxacode"), eq("1.2.3.4"), eq(30), any());

        mockMvc.perform(get("/api/v1/miniapp/wxacode").param("path", "pages/index/index"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429));
    }
}
