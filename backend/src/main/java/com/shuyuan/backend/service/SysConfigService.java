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
    public static final String DOC_PRIVACY = "doc_privacy";
    public static final String DOC_AGREEMENT = "doc_agreement";

    private static final String DEFAULT_PRIVACY =
            "<p>贵州交通职业大学中华文化书院（「我们」）重视您的个人信息保护。本政策说明云端书院小程序如何收集、使用与保护您的信息。</p>"
            + "<p><b>一、我们收集的信息</b></p>"
            + "<p>在您使用服务时，我们可能收集：微信昵称与头像（经您授权）、学号/账号信息（学号登录时）、浏览与学习行为记录（用于足迹与统计）、报名与反馈内容。</p>"
            + "<p><b>二、信息的使用</b></p>"
            + "<p>用于账号识别、内容展示、活动报名、学习进度、积分徽章、消息通知及平台安全审计。我们不会将您的个人信息出售给第三方。</p>"
            + "<p><b>三、存储与安全</b></p>"
            + "<p>数据存储于中华人民共和国境内服务器，采用加密传输（HTTPS）与访问控制。管理员操作留有审计日志。</p>"
            + "<p><b>四、您的权利</b></p>"
            + "<p>您可通过「意见反馈」或联系书院管理员查询、更正或删除相关账户信息（法律法规另有规定的除外）。</p>"
            + "<p><b>五、联系我们</b></p>"
            + "<p>邮箱：shuyuan@gzjtzy.edu.cn（占位）· 地址：贵州省贵阳市清镇职教城西区</p>";
    private static final String DEFAULT_AGREEMENT =
            "<p>使用云端书院即表示您同意遵守本协议及学校相关规定。平台内容仅供教育文化传播与非商业学习使用。</p>"
            + "<p>禁止利用本平台发布违法违规信息、攻击系统或干扰他人正常使用。AI 文化助手回答基于书院知识库，仅供参考，不构成专业意见。</p>";

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

    /** 协议/内容文档（隐私政策、用户协议）—— 供小程序与后台读取。 */
    public Map<String, Object> getContentDocs() {
        Map<String, Object> m = new HashMap<>();
        m.put("privacy", getString(DOC_PRIVACY, DEFAULT_PRIVACY));
        m.put("agreement", getString(DOC_AGREEMENT, DEFAULT_AGREEMENT));
        return m;
    }

    @Transactional
    public void saveContentDocs(String privacy, String agreement) {
        upsert(DOC_PRIVACY, privacy == null ? "" : privacy, "隐私政策");
        upsert(DOC_AGREEMENT, agreement == null ? "" : agreement, "用户协议");
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
