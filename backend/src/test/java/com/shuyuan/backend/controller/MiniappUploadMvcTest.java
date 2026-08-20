package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.controller.api.MiniappUploadController;
import com.shuyuan.backend.service.ApiErrorMetrics;
import com.shuyuan.backend.service.OssService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MiniappUploadMvcTest {

    @Mock
    private OssService ossService;

    private MockMvc mockMvc;

    @AfterEach
    void tearDown() {
        MemberContext.clear();
    }

    private void setupMvc() {
        MiniappUploadController controller = new MiniappUploadController(ossService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(new ApiErrorMetrics()))
                .build();
    }

    @Test
    void upload_withoutLogin_returns401() throws Exception {
        setupMvc();
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/v1/miniapp/upload").file(file))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void upload_withLogin_returnsUrl() throws Exception {
        setupMvc();
        MemberContext.setMemberId(42L);
        MockMultipartFile file = new MockMultipartFile("file", "shot.png", "image/png", new byte[]{9, 8, 7});
        when(ossService.upload(eq("feedback"), eq(file)))
                .thenReturn(Map.of("url", "https://cdn.example.com/images/a.png", "objectKey", "images/a.png"));

        mockMvc.perform(multipart("/api/v1/miniapp/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.url").value("https://cdn.example.com/images/a.png"));
    }

    @Test
    void upload_ossUnavailable_returns503() throws Exception {
        setupMvc();
        MemberContext.setMemberId(7L);
        MockMultipartFile file = new MockMultipartFile("file", "b.jpg", "image/jpeg", new byte[]{4});
        when(ossService.upload(eq("feedback"), eq(file)))
                .thenThrow(new BusinessException(503, "对象存储未配置，请设置 OSS 环境变量或手动填写 URL"));

        mockMvc.perform(multipart("/api/v1/miniapp/upload").file(file))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value(503));
    }
}
