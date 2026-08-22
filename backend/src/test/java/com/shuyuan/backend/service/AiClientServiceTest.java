package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.KnowledgeChunk;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiClientServiceTest {

    @Mock
    private ZhipuAiService zhipuAiService;

    @Mock
    private FallbackAiService fallbackAiService;

    @InjectMocks
    private AiClientService aiClientService;

    private static final String FALLBACK_ANSWER = "来自知识库的兜底回答";

    private List<KnowledgeChunk> chunks() {
        KnowledgeChunk c = new KnowledgeChunk();
        c.setChunkText("平台提供线上展馆、课程与活动报名。");
        return List.of(c);
    }

    @Test
    void 未配置Key时直接走知识库() {
        when(zhipuAiService.canUse()).thenReturn(false);
        when(fallbackAiService.chat(anyString(), anyString(), anyList())).thenReturn(FALLBACK_ANSWER);

        assertEquals(FALLBACK_ANSWER, aiClientService.chat(chunks(), "有哪些展馆？"));
        verify(zhipuAiService, never()).chat(anyString(), anyString());
    }

    @Test
    void 大模型可用时用大模型的回答() {
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(anyString(), anyString())).thenReturn("大模型回答");

        assertEquals("大模型回答", aiClientService.chat(chunks(), "有哪些展馆？"));
        verify(fallbackAiService, never()).chat(anyString(), anyString(), anyList());
    }

    /**
     * 接的是免费模型，QPS / 额度超限是常态。上游一挂就把异常抛给用户，
     * 用户看到的是「暂时无法回答」；而知识库片段本来就够答大部分问题。
     */
    @Test
    void 大模型抛异常时降级到知识库而不是报错() {
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(anyString(), anyString()))
                .thenThrow(new BusinessException(502, "AI 服务暂时不可用，请稍后重试"));
        when(fallbackAiService.chat(anyString(), anyString(), anyList())).thenReturn(FALLBACK_ANSWER);

        assertEquals(FALLBACK_ANSWER, aiClientService.chat(chunks(), "有哪些展馆？"));
    }

    @Test
    void 大模型返回空内容时也降级() {
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(anyString(), anyString())).thenReturn("   ");
        when(fallbackAiService.chat(anyString(), anyString(), anyList())).thenReturn(FALLBACK_ANSWER);

        assertEquals(FALLBACK_ANSWER, aiClientService.chat(chunks(), "有哪些展馆？"));
    }

    /**
     * 提示词决定模型如何自称，而模型的回答用户直接看得到。
     * 小程序里运营主体是公司、书院只是内容来源，助手不能冒学校或书院的名义说话。
     */
    @Test
    void 提示词不得冒任何机构的名义() {
        when(zhipuAiService.canUse()).thenReturn(true);
        when(zhipuAiService.chat(anyString(), anyString())).thenReturn("ok");

        org.mockito.ArgumentCaptor<String> system = org.mockito.ArgumentCaptor.forClass(String.class);
        aiClientService.chat(chunks(), "你是谁？");
        verify(zhipuAiService).chat(system.capture(), anyString());

        String prompt = system.getValue();
        for (String banned : new String[]{"贵州交通职业大学", "中华文化书院", "文化助手"}) {
            assertFalse(prompt.contains(banned), "提示词里不该出现「" + banned + "」：" + prompt);
        }
    }
}
