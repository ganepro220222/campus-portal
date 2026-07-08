package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.CollegeApp;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CollegeAppService {

    private static final String[] COLOR_CLASSES = {"hc1", "hc2", "hc3", "hc4", "hc5"};

    private final CollegeAppMapper collegeAppMapper;

    public List<Map<String, Object>> listActive() {
        List<CollegeApp> list = collegeAppMapper.selectList(new LambdaQueryWrapper<CollegeApp>()
                .eq(CollegeApp::getStatus, 1)
                .orderByAsc(CollegeApp::getSort)
                .orderByAsc(CollegeApp::getId));
        return list.stream().map(this::toMiniappVo).toList();
    }

    static String deriveShort(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String n = name.replace("学院", "").trim();
        if (n.isEmpty()) {
            return name.length() <= 2 ? name : name.substring(0, 2);
        }
        return n.length() <= 2 ? n : n.substring(0, 2);
    }

    static String contentTypeLabel(String type) {
        if (type == null) {
            return "";
        }
        if ("manual".equals(type)) {
            return "校内协同";
        }
        if ("jump".equals(type)) {
            return "小程序跳转";
        }
        if ("embed_h5".equals(type)) {
            return "H5 嵌入";
        }
        if ("api_sync".equals(type)) {
            return "接口同步";
        }
        return type;
    }

    private Map<String, Object> toMiniappVo(CollegeApp c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("short", deriveShort(c.getName()));
        m.put("en", contentTypeLabel(c.getContentType()));
        m.put("desc", c.getDescription() != null ? c.getDescription() : "");
        int sort = c.getSort() != null ? c.getSort() : 0;
        m.put("colorClass", COLOR_CLASSES[Math.floorMod(sort, COLOR_CLASSES.length)]);
        m.put("iconUrl", c.getIconUrl());
        m.put("contentType", c.getContentType());
        m.put("appid", c.getAppid());
        m.put("path", c.getPath());
        m.put("contentUrl", c.getContentUrl());
        return m;
    }
}
