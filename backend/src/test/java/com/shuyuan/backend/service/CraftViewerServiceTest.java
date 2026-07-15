package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.dto.CraftViewerConfigSaveRequest;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.util.GlbTestFixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CraftViewerServiceTest {

    @Mock
    private CraftMapper craftMapper;
    @Mock
    private CraftContactMapper craftContactMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private OssService ossService;
    @Mock
    private OssProperties ossProperties;

    @InjectMocks
    private CraftViewerService craftViewerService;

    @Test
    void getViewerConfig_throwsWhenNotEnabled() {
        Craft craft = readyCraft(1L);
        craft.setViewerEnabled(0);
        when(craftMapper.selectById(1L)).thenReturn(craft);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> craftViewerService.getViewerConfig(1L));
        assertEquals(404, ex.getCode());
    }

    @Test
    void getViewerConfig_returnsDefaultsWhenJsonMissing() {
        Craft craft = readyCraft(2L);
        when(craftMapper.selectById(2L)).thenReturn(craft);
        when(craftContactMapper.selectById(2L)).thenReturn(null);

        Map<String, Object> vo = craftViewerService.getViewerConfig(2L);

        assertEquals("https://cdn.example.com/m.glb", vo.get("modelUrl"));
        assertEquals(1.0, ((Map<?, ?>) vo.get("transform")).get("scale"));
        assertEquals(0.15, ((Map<?, ?>) vo.get("material")).get("roughness"));
        assertEquals(8.4, ((Map<?, ?>) vo.get("camera")).get("distance"));
        assertEquals(Boolean.FALSE, vo.get("contactEnabled"));
        assertEquals(2, ((java.util.List<?>) vo.get("envPresets")).size());
    }

    @Test
    void saveViewerConfig_rejectsEnableWithoutModel() {
        Craft craft = new Craft();
        craft.setId(3L);
        craft.setStatus(1);
        craft.setPreviewType("images");
        craft.setViewerEnabled(0);
        when(craftMapper.selectById(3L)).thenReturn(craft);

        CraftViewerConfigSaveRequest req = new CraftViewerConfigSaveRequest();
        req.setViewerEnabled(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> craftViewerService.saveViewerConfig(3L, req));
        assertEquals(400, ex.getCode());
        verify(craftMapper, never()).updateById(any(Craft.class));
    }

    @Test
    void uploadModel_persistsModelUrlAndTransform() {
        Craft craft = new Craft();
        craft.setId(4L);
        craft.setStatus(1);
        when(craftMapper.selectById(4L)).thenReturn(craft);
        when(ossProperties.getMaxUploadBytes()).thenReturn(10L * 1024 * 1024);

        byte[] glb = GlbTestFixtures.meshGlb(GlbTestFixtures.defaultMeshJson(), 36);
        MockMultipartFile file = new MockMultipartFile("file", "a.glb", "model/gltf-binary", glb);
        when(ossService.uploadModel3dGlb(4L, glb)).thenReturn(Map.of(
                "url", "https://cdn.example.com/models/202607/4-abc12345.glb",
                "objectKey", "models/202607/4-abc12345.glb"
        ));

        Map<String, Object> result = craftViewerService.uploadModel(
                4L, file, "{\"scale\":0.5,\"offsetX\":0,\"offsetY\":0,\"offsetZ\":0}");

        assertEquals("https://cdn.example.com/models/202607/4-abc12345.glb", result.get("model3dUrl"));
        assertEquals("model3d", craft.getPreviewType());
        assertNotNull(craft.getTransformJson());
        verify(craftMapper).updateById(craft);
    }

    @Test
    void uploadModel_rejectsWhenAutoNormalizeFailsWithoutManualTransform() {
        Craft craft = new Craft();
        craft.setId(6L);
        craft.setStatus(1);
        craft.setTransformJson("{\"scale\":9.9,\"offsetX\":1,\"offsetY\":2,\"offsetZ\":3}");
        when(craftMapper.selectById(6L)).thenReturn(craft);
        when(ossProperties.getMaxUploadBytes()).thenReturn(10L * 1024 * 1024);

        String json = """
                {"asset":{"version":"2.0"},
                 "buffers":[{"byteLength":36}],
                 "bufferViews":[{"buffer":0,"byteLength":36}],
                 "accessors":[{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3"}],
                 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}]}\
                """;
        byte[] glb = GlbTestFixtures.meshGlb(json, 36);
        MockMultipartFile file = new MockMultipartFile("file", "bad.glb", "model/gltf-binary", glb);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> craftViewerService.uploadModel(6L, file, null));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("无法自动计算归一化参数"));
        verify(ossService, never()).uploadModel3dGlb(any(), any());
        verify(craftMapper, never()).updateById(any(Craft.class));
        assertEquals("{\"scale\":9.9,\"offsetX\":1,\"offsetY\":2,\"offsetZ\":3}", craft.getTransformJson());
    }

    private static Craft readyCraft(Long id) {
        Craft craft = new Craft();
        craft.setId(id);
        craft.setName("测试工艺");
        craft.setIntroZh("简介");
        craft.setStatus(1);
        craft.setPreviewType("model3d");
        craft.setModel3dUrl("https://cdn.example.com/m.glb");
        craft.setViewerEnabled(1);
        return craft;
    }

    @Test
    void isViewerReady_requiresAllFlags() {
        Craft craft = readyCraft(5L);
        assertTrue(CraftViewerService.isViewerReady(craft));
        craft.setViewerEnabled(0);
        assertFalse(CraftViewerService.isViewerReady(craft));
        craft.setViewerEnabled(1);
        craft.setPreviewType("images");
        assertFalse(CraftViewerService.isViewerReady(craft));
    }
}
