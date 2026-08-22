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
    public static final String ABOUT_INTRO = "about_intro";
    public static final String CONTACT_ADDRESS = "contact_address";
    public static final String CONTACT_PHONE = "contact_phone";
    public static final String CONTACT_EMAIL = "contact_email";
    public static final String ABOUT_ICP = "about_icp";

    /*
     * 下面这些默认值不是「示例数据」——后台没配时，接口返回的就是它们，
     * 小程序照单展示，提审时审核员看到的也是它们。所以它们必须始终是
     * 可以直接对外的文案，且与 miniapp/utils/miniappConfig.js 里的 DEFAULT 逐字一致：
     * 后端非空就会盖掉小程序侧的兜底（`res.intro || this.data.intro`），
     * 两边写得不一样等于小程序那份永远不生效，改了也白改。
     */
    private static final String DEFAULT_ABOUT_INTRO =
            "云端书院是面向校园的线上学习服务平台，整合线上展馆、精品课程、文创展示与活动报名等功能，"
            + "支持随时随地学习与交流，线上线下相结合。";

    /*
     * 联系方式默认留空，关于页对这三行都有 wx:if，空值即不渲染。
     * 原先内置的是 0851-12345678 与 shuyuan@gzjtzy.edu.cn：号码是编的，
     * 邮箱是学校的 edu.cn 域——备案主体已是贵州云漫科技有限公司，
     * 界面上再挂学校域名的联系方式，与主体和授权范围都对不上。
     * 真实联系方式请在后台「内容配置」填写。
     */
    private static final String DEFAULT_ADDRESS = "";
    private static final String DEFAULT_PHONE = "";
    private static final String DEFAULT_EMAIL = "";

    /*
     * 隐私政策 / 用户协议不再内置 Java 版默认值：基线正文只留一份，
     * 在 miniapp/utils/legalDocuments.js 的 BASELINE 里。这里返回空串时，
     * 小程序会自动落到那份基线（见 resolveFromSources），后台编辑器则显示空白，
     * 提示管理员这两份文档尚未正式配置。
     * 早先这里内置的版本写的是「贵州交通职业大学中华文化书院（我们）」并留了
     * edu.cn 邮箱，一直在盖掉小程序里已经改好的基线。
     */

    private static final String DEFAULT_WELCOME =
            "你好！我是书院助手，可以基于平台知识库为你解答使用与学习相关的问题。";
    private static final String DEFAULT_CHIPS_JSON =
            "[\"平台有哪些线上展馆？\",\"怎么报名参加活动？\",\"在哪查看学习足迹？\"]";
    private static final String DEFAULT_HOT_TAGS_JSON =
            "[\"线上展馆\",\"精品课程\",\"活动报名\",\"学习资源\",\"文创展示\"]";

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
        m.put("privacy", getString(DOC_PRIVACY, ""));
        m.put("agreement", getString(DOC_AGREEMENT, ""));
        return m;
    }

    @Transactional
    public void saveContentDocs(String privacy, String agreement) {
        upsert(DOC_PRIVACY, privacy == null ? "" : privacy, "隐私政策");
        upsert(DOC_AGREEMENT, agreement == null ? "" : agreement, "用户协议");
    }

    /** 关于页可配置内容（简介、联系方式、备案号）。 */
    public Map<String, Object> getAboutConfig() {
        Map<String, Object> m = new HashMap<>();
        m.put("intro", getString(ABOUT_INTRO, DEFAULT_ABOUT_INTRO));
        m.put("address", getString(CONTACT_ADDRESS, DEFAULT_ADDRESS));
        m.put("phone", getString(CONTACT_PHONE, DEFAULT_PHONE));
        m.put("email", getString(CONTACT_EMAIL, DEFAULT_EMAIL));
        m.put("icp", getString(ABOUT_ICP, ""));
        return m;
    }

    @Transactional
    public void saveAboutConfig(String intro, String address, String phone, String email, String icp) {
        upsert(ABOUT_INTRO, intro == null ? "" : intro, "书院简介");
        upsert(CONTACT_ADDRESS, address == null ? "" : address, "联系地址");
        upsert(CONTACT_PHONE, phone == null ? "" : phone, "联系电话");
        upsert(CONTACT_EMAIL, email == null ? "" : email, "联系邮箱");
        upsert(ABOUT_ICP, icp == null ? "" : icp, "备案号");
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
