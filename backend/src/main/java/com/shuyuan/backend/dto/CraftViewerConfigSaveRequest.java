package com.shuyuan.backend.dto;

import lombok.Data;

import java.util.Map;

/**
 * 沉浸式鉴赏配置（管理端 PUT /admin/crafts/{id}/viewer-config）
 */
@Data
public class CraftViewerConfigSaveRequest {

    /** 是否开启沉浸式鉴赏入口 */
    private Boolean viewerEnabled;
    /** 加载期封面图 URL */
    private String posterUrl;
    /** 归一化参数，来自批处理 manifest */
    private Map<String, Object> transform;
    /** PBR 材质参数 */
    private Map<String, Object> material;
    /** 初始机位 */
    private Map<String, Object> camera;
}
