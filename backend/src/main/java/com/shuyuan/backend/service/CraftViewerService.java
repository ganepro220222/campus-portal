package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.dto.CraftViewerConfigSaveRequest;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.util.GlbValidator;
import com.shuyuan.backend.util.GlbTransformUtil;
import com.shuyuan.backend.util.JsonFieldHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 工艺品沉浸式 3D 鉴赏：公开配置接口与管理端模型/配置写入（无 UI，供 H5/小程序对接）。
 */
@Service
@RequiredArgsConstructor
public class CraftViewerService {

    /** 单文件 GLB 上限（字节），与方案「>8MB 需压缩」对齐 */
    private static final long MAX_GLB_BYTES = 8L * 1024 * 1024;

    private static final Map<String, Object> DEFAULT_TRANSFORM = Map.of(
            "scale", 1.0,
            "offsetX", 0.0,
            "offsetY", 0.0,
            "offsetZ", 0.0
    );
    private static final Map<String, Object> DEFAULT_MATERIAL = Map.of(
            "roughness", 0.15,
            "metalness", 0.02,
            "envMapIntensity", 1.3
    );
    private static final Map<String, Object> DEFAULT_CAMERA = Map.of(
            "distance", 8.4,
            "phi", 1.48,
            "theta", 0.35,
            "autoRotate", true
    );

    private final CraftMapper craftMapper;
    private final CraftContactMapper craftContactMapper;
    private final AdminPermissionService adminPermissionService;
    private final OssService ossService;
    private final OssProperties ossProperties;

    /** 公开：H5 鉴赏页一次拉全配置 */
    public Map<String, Object> getViewerConfig(Long id) {
        Craft craft = requireOnlineCraft(id);
        if (!isViewerReady(craft)) {
            throw new BusinessException(404, "该工艺品未开启沉浸式鉴赏");
        }
        return buildViewerPayload(craft, true);
    }

    /** 管理端：读取当前鉴赏配置（编辑回填，不含公开 env 降级逻辑） */
    public Map<String, Object> getAdminViewerConfig(Long id) {
        adminPermissionService.require("hall:read");
        Craft craft = requireCraft(id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("viewerEnabled", craft.getViewerEnabled() != null && craft.getViewerEnabled() == 1);
        m.put("posterUrl", craft.getPosterUrl());
        m.put("model3dUrl", craft.getModel3dUrl());
        m.put("transform", JsonFieldHelper.parseObject(craft.getTransformJson()));
        m.put("material", JsonFieldHelper.parseObject(craft.getMaterialJson()));
        m.put("camera", JsonFieldHelper.parseObject(craft.getCameraJson()));
        return m;
    }

    /**
     * 管理端：上传 GLB → 校验 → OSS（内容哈希命名）→ 写 model_3d_url。
     * transformJson 可选，来自批处理 manifest 的 JSON 字符串。
     */
    @Transactional
    public Map<String, Object> uploadModel(Long id, MultipartFile file, String transformJson) {
        adminPermissionService.require("hall:write");
        Craft craft = requireCraft(id);
        byte[] bytes = readGlbBytes(file);
        GlbValidator.Result validation = GlbValidator.validate(bytes, MAX_GLB_BYTES);
        if (!validation.valid()) {
            String msg = validation.warnings().isEmpty() ? "GLB 校验未通过" : String.join("；", validation.warnings());
            throw new BusinessException(400, msg);
        }

        List<String> uploadWarnings = new ArrayList<>(validation.warnings());
        Map<String, Object> transformToWrite;
        if (StringUtils.hasText(transformJson)) {
            transformToWrite = JsonFieldHelper.parseObject(normalizeJsonString(transformJson));
        } else {
            Map<String, Object> computed = GlbTransformUtil.computeTransform(bytes);
            if (computed == null) {
                throw new BusinessException(400,
                        "无法自动计算归一化参数，请粘贴 manifest 中的 transform JSON 后保存，或使用含 POSITION min/max 的 GLB");
            }
            transformToWrite = computed;
            uploadWarnings.add("已根据 GLB 包围盒自动计算归一化参数");
        }

        Map<String, String> uploaded = ossService.uploadModel3dGlb(id, bytes);
        craft.setModel3dUrl(uploaded.get("url"));
        craft.setPreviewType("model3d");
        craft.setTransformJson(JsonFieldHelper.writeObject(transformToWrite));
        craftMapper.updateById(craft);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("model3dUrl", craft.getModel3dUrl());
        result.put("objectKey", uploaded.get("objectKey"));
        result.put("glbSha1", validation.glbSha1());
        result.put("meshCount", validation.meshCount());
        result.put("materialCount", validation.materialCount());
        result.put("imageCount", validation.imageCount());
        result.put("warnings", uploadWarnings);
        result.put("transform", transformToWrite);
        return result;
    }

    @Transactional
    public Map<String, Object> saveViewerConfig(Long id, CraftViewerConfigSaveRequest req) {
        adminPermissionService.require("hall:write");
        Craft craft = requireCraft(id);
        if (req.getViewerEnabled() != null) {
            craft.setViewerEnabled(Boolean.TRUE.equals(req.getViewerEnabled()) ? 1 : 0);
        }
        if (req.getPosterUrl() != null) {
            craft.setPosterUrl(trimOrNull(req.getPosterUrl()));
        }
        if (req.getTransform() != null) {
            craft.setTransformJson(JsonFieldHelper.writeObject(req.getTransform()));
        }
        if (req.getMaterial() != null) {
            craft.setMaterialJson(JsonFieldHelper.writeObject(req.getMaterial()));
        }
        if (req.getCamera() != null) {
            craft.setCameraJson(JsonFieldHelper.writeObject(req.getCamera()));
        }
        if (craft.getViewerEnabled() != null && craft.getViewerEnabled() == 1 && !isViewerReady(craft)) {
            throw new BusinessException(400, "开启沉浸式鉴赏需先配置有效的 GLB 模型地址");
        }
        craftMapper.updateById(craft);
        return getAdminViewerConfig(id);
    }

    public static boolean isViewerReady(Craft craft) {
        return craft != null
                && craft.getViewerEnabled() != null
                && craft.getViewerEnabled() == 1
                && StringUtils.hasText(craft.getModel3dUrl())
                && "model3d".equals(craft.getPreviewType());
    }

    public static Map<String, Object> viewerFieldsForVo(Craft craft) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("viewerEnabled", craft.getViewerEnabled() != null && craft.getViewerEnabled() == 1);
        m.put("posterUrl", craft.getPosterUrl());
        m.put("transform", JsonFieldHelper.parseObject(craft.getTransformJson()));
        m.put("material", JsonFieldHelper.parseObject(craft.getMaterialJson()));
        m.put("camera", JsonFieldHelper.parseObject(craft.getCameraJson()));
        return m;
    }

    private Map<String, Object> buildViewerPayload(Craft craft, boolean includeContact) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", craft.getId());
        m.put("name", craft.getName());
        m.put("summary", craft.getIntroZh());
        m.put("modelUrl", craft.getModel3dUrl());
        m.put("posterUrl", craft.getPosterUrl());
        m.put("transform", JsonFieldHelper.defaultsIfNull(
                JsonFieldHelper.parseObject(craft.getTransformJson()), DEFAULT_TRANSFORM));
        m.put("material", JsonFieldHelper.defaultsIfNull(
                JsonFieldHelper.parseObject(craft.getMaterialJson()), DEFAULT_MATERIAL));
        m.put("camera", JsonFieldHelper.defaultsIfNull(
                JsonFieldHelper.parseObject(craft.getCameraJson()), DEFAULT_CAMERA));
        m.put("hotspots", List.of());
        m.put("envPresets", builtinEnvPresets());
        m.put("defaultEnvId", 1);
        m.put("viewerEnabled", true);
        if (includeContact) {
            m.put("contactEnabled", craftContactMapper.selectById(craft.getId()) != null);
        }
        return m;
    }

    /** MVP 内置环境预设；panoramaUrl 待云资源就绪后由增强版 env_preset 表替代 */
    private static List<Map<String, Object>> builtinEnvPresets() {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(preset(1, "影棚布光", null, 1.0, "#14161d"));
        list.add(preset(2, "暖色展厅", null, 1.2, "#1a1510"));
        return list;
    }

    private static Map<String, Object> preset(int id, String name, String panoramaUrl,
                                              double exposure, String bgColor) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("panoramaUrl", panoramaUrl);
        m.put("exposure", exposure);
        m.put("bgColor", bgColor);
        return m;
    }

    private Craft requireCraft(Long id) {
        Craft craft = craftMapper.selectById(id);
        if (craft == null) {
            throw new BusinessException(404, "文创不存在");
        }
        return craft;
    }

    private Craft requireOnlineCraft(Long id) {
        Craft craft = requireCraft(id);
        if (craft.getStatus() == null || craft.getStatus() != 1) {
            throw new BusinessException(404, "文创不存在");
        }
        return craft;
    }

    private byte[] readGlbBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "上传文件不能为空");
        }
        if (file.getSize() > ossProperties.getMaxUploadBytes()) {
            throw new BusinessException(400, "文件过大，请压缩后重试");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".glb")) {
            throw new BusinessException(400, "仅支持 .glb 二进制单文件");
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(500, "读取上传文件失败");
        }
    }

    private String normalizeJsonString(String json) {
        String trimmed = json.trim();
        JsonFieldHelper.parseObject(trimmed);
        return trimmed;
    }

    private String trimOrNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
