package com.shuyuan.backend.controller;

import com.shuyuan.backend.controller.api.ResourceController;
import com.shuyuan.backend.service.ResourceService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResourceControllerMvcTest {

    @Mock
    private ResourceService resourceService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ResourceController(resourceService))
                .build();
    }

    @Test
    void chunkRoute_mapsToChunkService() throws Exception {
        mockMvc.perform(get("/api/v1/resources/9/file-chunks")
                        .param("offset", "4194304")
                        .param("size", "2097152"))
                .andExpect(status().isOk());

        verify(resourceService).writeFileChunk(
                org.mockito.ArgumentMatchers.eq(9L),
                org.mockito.ArgumentMatchers.eq(4_194_304L),
                org.mockito.ArgumentMatchers.eq(2_097_152),
                any(HttpServletResponse.class));
        verify(resourceService, never()).writeFile(
                org.mockito.ArgumentMatchers.eq(9L),
                any(HttpServletResponse.class));
    }

    @Test
    void chunkRoute_requiresOffset() throws Exception {
        mockMvc.perform(get("/api/v1/resources/9/file-chunks"))
                .andExpect(status().isBadRequest());

        verify(resourceService, never()).writeFileChunk(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyInt(),
                any(HttpServletResponse.class));
    }
}
