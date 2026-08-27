package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.AiPolishRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAiPolishServiceTest {

    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private ZhipuAiService zhipuAiService;
    @Mock
    private AiCopyAssistFallbackService fallbackService;
    @Mock
    private ContentSafetyService contentSafetyService;
    @Mock
    private RateLimitService rateLimitService;

    private ShuyuanProperties properties;
    private AdminAiPolishService adminAiPolishService;

    @BeforeEach
    void setUp() {
        // 用真的 ShuyuanProperties 而不是 mock：额度是个具体数字，测试里也该看得见
        properties = new ShuyuanProperties();
        properties.getAi().setDailyLimit(60);
        adminAiPolishService = new AdminAiPolishService(
                adminPermissionService, zhipuAiService, fallbackService,
                contentSafetyService, rateLimitService, properties);
    }

    /** 撞到上限才第一次知道有上限，是最糟的交互；所以每次结果都要把余额带回去 */
    @Test
    void polish_returnsRemainingQuotaWithResult() {
        AiPolishRequest req = request("书院举办文化讲座", "title");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(any(), any())).thenReturn("三个标题建议");
        when(rateLimitService.getUserCalendarDayUsage(RateLimitService.SCENE_AI_POLISH, 7L))
                .thenReturn(4);

        var vo = adminAiPolishService.polish(req);

        assertEquals(60, vo.get("dailyLimit"));
        assertEquals(56, vo.get("remainingToday"));
    }

    @Test
    void polish_remainingNeverGoesNegative() {
        AiPolishRequest req = request("正文", "polish");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        when(zhipuAiService.canUse()).thenReturn(false);
        when(fallbackService.transform(any(), any())).thenReturn("润色结果");
        when(rateLimitService.getUserCalendarDayUsage(RateLimitService.SCENE_AI_POLISH, 7L))
                .thenReturn(99);

        assertEquals(0, adminAiPolishService.polish(req).get("remainingToday"));
    }

    @Test
    void polish_usesZhipuWhenConfigured() {
        AiPolishRequest req = request("润色书院新闻正文", "polish");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(any(), any())).thenReturn("典雅润色后的正文");

        var vo = adminAiPolishService.polish(req);

        assertEquals("典雅润色后的正文", vo.get("content"));
        assertEquals("polish", vo.get("action"));
        assertEquals(false, vo.get("fallback"));
    }

    @Test
    void polish_usesFallbackWhenNoApiKey() {
        AiPolishRequest req = request("书院举办文化讲座", "summarize");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);
        when(contentSafetyService.checkText(any())).thenReturn(true);
        when(zhipuAiService.canUse()).thenReturn(false);
        when(fallbackService.transform("summarize", req.getContent())).thenReturn("书院举办文化讲座摘要");

        var vo = adminAiPolishService.polish(req);

        assertEquals("书院举办文化讲座摘要", vo.get("content"));
        assertTrue((Boolean) vo.get("fallback"));
    }

    @Test
    void polish_blocksUnsafeInput() {
        AiPolishRequest req = request("违规内容", "polish");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);
        when(contentSafetyService.checkText(req.getContent())).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminAiPolishService.polish(req));
        assertEquals(400, ex.getCode());
    }

    @Test
    void polish_rejectsUnknownAction() {
        AiPolishRequest req = request("正文", "rewrite");
        when(adminPermissionService.requireAdminId()).thenReturn(7L);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminAiPolishService.polish(req));
        assertEquals(400, ex.getCode());
    }

    @Test
    void polish_requiresNewsWritePermission() {
        doThrow(new BusinessException(403, "无操作权限"))
                .when(adminPermissionService).require("news:write");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminAiPolishService.polish(request("正文", "polish")));
        assertEquals(403, ex.getCode());
    }

    private AiPolishRequest request(String content, String action) {
        AiPolishRequest req = new AiPolishRequest();
        req.setContent(content);
        req.setAction(action);
        req.setTone("cultural");
        return req;
    }
}
