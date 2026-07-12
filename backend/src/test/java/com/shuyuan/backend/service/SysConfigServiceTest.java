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

    @Test
    void getMiniappPublicConfig_usesDefaultsWhenMissing() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        Map<String, Object> config = sysConfigService.getMiniappPublicConfig();
        assertTrue(config.get("aiAssistantWelcome").toString().contains("书院文化助手"));
        assertEquals(3, ((List<?>) config.get("aiAssistantChips")).size());
    }

    @Test
    void saveAiAssistantAdminConfig_insertsNewRows() {
        when(sysConfigMapper.selectById(any())).thenReturn(null);
        sysConfigService.saveAiAssistantAdminConfig("欢迎", List.of("问题1"), List.of("热词1"));
        verify(sysConfigMapper, times(3)).insert(any(SysConfig.class));
    }
}
