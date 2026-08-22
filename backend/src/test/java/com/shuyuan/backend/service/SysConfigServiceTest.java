package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.SysConfig;
import com.shuyuan.backend.mapper.SysConfigMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SysConfigServiceTest {

    @Mock
    private SysConfigMapper sysConfigMapper;

    @InjectMocks
    private SysConfigService sysConfigService;

    /*
     * 这些默认值不是「示例」：后台没配时接口返回的就是它们，小程序照单展示，
     * 提审时审核员看到的也是它们。所以拿它们当对外文案来测。
     */
    @Test
    void getMiniappPublicConfig_usesDefaultsWhenMissing() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        Map<String, Object> config = sysConfigService.getMiniappPublicConfig();
        assertTrue(config.get("aiAssistantWelcome").toString().contains("书院助手"));
        assertEquals(3, ((List<?>) config.get("aiAssistantChips")).size());
        assertEquals(5, ((List<?>) config.get("searchHotTags")).size());
    }

    /**
     * 备案主体是贵州云漫科技有限公司，界面不打学校名号；按微信审核口径也要避开
     * 「文化 / 历史 / 政治」类话题表述。默认文案一旦回到内容话题，这条会红。
     */
    @Test
    void defaultTexts_carryNoSchoolIdentityOrTopicalFraming() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        String blob = sysConfigService.getMiniappPublicConfig().toString()
                + sysConfigService.getAboutConfig()
                + sysConfigService.getAiAssistantAdminConfig();
        for (String banned : new String[]{
                "贵州交通职业大学", "gzjtzy.edu.cn", "马院", "思政",
                "阳明", "屯堡", "红色", "非遗", "文化助手"}) {
            assertFalse(blob.contains(banned), "默认文案里不该再出现「" + banned + "」：" + blob);
        }
    }

    /**
     * 隐私政策 / 用户协议后端不再内置正文：基线只留 miniapp/utils/legalDocuments.js 一份。
     * 这里返回非空就会盖掉小程序那份（`pickRemoteField` 非空即采用），改了也白改。
     */
    @Test
    void contentDocs_areEmptyUntilConfigured() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        Map<String, Object> docs = sysConfigService.getContentDocs();
        assertEquals("", docs.get("privacy"));
        assertEquals("", docs.get("agreement"));
    }

    /** 关于页联系方式默认留空，wxml 有 wx:if——宁可不显示，也不显示编的电话与 edu.cn 邮箱。 */
    @Test
    void aboutContacts_areEmptyUntilConfigured() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        Map<String, Object> about = sysConfigService.getAboutConfig();
        assertEquals("", about.get("address"));
        assertEquals("", about.get("phone"));
        assertEquals("", about.get("email"));
    }

    @Test
    void saveAiAssistantAdminConfig_insertsNewRows() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        sysConfigService.saveAiAssistantAdminConfig("欢迎", List.of("问题1"), List.of("热词1"));
        verify(sysConfigMapper, times(3)).insert(any(SysConfig.class));
    }
}
