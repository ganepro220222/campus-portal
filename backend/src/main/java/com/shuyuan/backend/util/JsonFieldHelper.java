package com.shuyuan.backend.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;

import java.util.LinkedHashMap;
import java.util.Map;

/** JSON 列与 Map 互转（craft transform/material/camera 等） */
public final class JsonFieldHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private JsonFieldHelper() {
    }

    public static Map<String, Object> parseObject(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "JSON 字段解析失败");
        }
    }

    public static String writeObject(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new BusinessException(400, "JSON 字段格式无效");
        }
    }

    public static Map<String, Object> defaultsIfNull(Map<String, Object> map, Map<String, Object> defaults) {
        if (map != null && !map.isEmpty()) {
            return map;
        }
        return new LinkedHashMap<>(defaults);
    }
}
