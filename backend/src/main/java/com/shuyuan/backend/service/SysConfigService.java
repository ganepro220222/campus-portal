package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SysConfig;
import com.shuyuan.backend.mapper.SysConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SysConfigService {

    public static final String AI_ASSISTANT_WELCOME = "ai_assistant_welcome";
    public static final String AI_ASSISTANT_CHIPS = "ai_assistant_chips";
    public static final String SEARCH_HOT_TAGS = "search_hot_tags";

    private static final String DEFAULT_WELCOME =
            "你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。";
    private static final String DEFAULT_CHIPS_JSON =
            "[\"什么是阳明文化？\",\"屯堡文化有何特色？\",\"龙场悟道讲了什么？\"]";
    private static final String DEFAULT_HOT_TAGS_JSON =
            "[\"阳明文化\",\"屯堡地戏\",\"红色交通\",\"非遗银饰\",\"知行合一\"]";

    private final SysConfigMapper sysConfigMapper;

    public String getString(String key, String defaultValue) {
        SysConfig row = sysConfigMapper.selectById(key);
        if (row == null || row.getConfigValue() == null || row.getConfigValue().isBlank()) {
            return defaultValue;
        }
        return row.getConfigValue().trim();
    }

    @Transactional
    public void upsert(String key, String value, String remark) {
        SysConfig existing = sysConfigMapper.selectById(key);
        if (existing == null) {
            SysConfig row = new SysConfig();
            row.setConfigKey(key);
            row.setConfigValue(value);
            row.setRemark(remark);
            sysConfigMapper.insert(row);
            return;
        }
        existing.setConfigValue(value);
        if (remark != null) {
            existing.setRemark(remark);
        }
        sysConfigMapper.updateById(existing);
    }

    public Map<String, Object> getMiniappPublicConfig() {
        Map<String, Object> m = new HashMap<>();
        m.put("aiAssistantWelcome", getString(AI_ASSISTANT_WELCOME, DEFAULT_WELCOME));
        m.put("aiAssistantChips", parseJsonStringList(getString(AI_ASSISTANT_CHIPS, DEFAULT_CHIPS_JSON)));
        m.put("searchHotTags", parseJsonStringList(getString(SEARCH_HOT_TAGS, DEFAULT_HOT_TAGS_JSON)));
        return m;
    }

    public Map<String, Object> getAiAssistantAdminConfig() {
        Map<String, Object> m = new HashMap<>();
        m.put("welcomeText", getString(AI_ASSISTANT_WELCOME, DEFAULT_WELCOME));
        m.put("suggestQuestions", parseJsonStringList(getString(AI_ASSISTANT_CHIPS, DEFAULT_CHIPS_JSON)));
        m.put("searchHotTags", parseJsonStringList(getString(SEARCH_HOT_TAGS, DEFAULT_HOT_TAGS_JSON)));
        return m;
    }

    @Transactional
    public void saveAiAssistantAdminConfig(String welcomeText, List<String> suggestQuestions, List<String> searchHotTags) {
        if (welcomeText == null || welcomeText.isBlank()) {
            throw new BusinessException(400, "欢迎语不能为空");
        }
        if (suggestQuestions == null || suggestQuestions.isEmpty()) {
            throw new BusinessException(400, "推荐问题至少 1 条");
        }
        upsert(AI_ASSISTANT_WELCOME, welcomeText.trim(), "AI 助手欢迎语");
        upsert(AI_ASSISTANT_CHIPS, toJsonArray(suggestQuestions), "AI 助手推荐问题");
        if (searchHotTags != null && !searchHotTags.isEmpty()) {
            upsert(SEARCH_HOT_TAGS, toJsonArray(searchHotTags), "搜索热词");
        }
    }

    private static List<String> parseJsonStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String toJsonArray(List<String> items) {
        try {
            List<String> cleaned = items.stream()
                    .map(s -> s == null ? "" : s.trim())
                    .filter(s -> !s.isBlank())
                    .toList();
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(cleaned);
        } catch (Exception e) {
            throw new IllegalStateException("配置序列化失败");
        }
    }
}
