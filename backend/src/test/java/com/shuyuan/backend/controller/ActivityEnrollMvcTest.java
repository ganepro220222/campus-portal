package com.shuyuan.backend.controller;

import com.shuyuan.backend.common.GlobalExceptionHandler;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.controller.api.ActivityController;
import com.shuyuan.backend.dto.EnrollRequest;
import com.shuyuan.backend.service.ActivityService;
import com.shuyuan.backend.service.EnrollService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 活动报名接口：未登录 401（standalone MockMvc）
 */
@ExtendWith(MockitoExtension.class)
class ActivityEnrollMvcTest {

    private MockMvc mockMvc;

    @Mock
    private ActivityService activityService;
    @Mock
    private EnrollService enrollService;

    @BeforeEach
    void setUp() {
        ActivityController controller = new ActivityController(activityService, enrollService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void enroll_withoutLogin_returns401() throws Exception {
        when(enrollService.enroll(eq(1L), any(EnrollRequest.class)))
                .thenThrow(new BusinessException(401, "请先登录"));

        mockMvc.perform(post("/api/v1/activities/1/enroll")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }
}
