package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AiPolishRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

    @InjectMocks
    private AdminAiPolishService adminAiPolishService;

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
