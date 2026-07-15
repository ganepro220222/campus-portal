package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.CraftContact;
import com.shuyuan.backend.entity.CraftImage;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftImageMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CraftServiceTest {

    @Mock
    private CraftMapper craftMapper;
    @Mock
    private CraftImageMapper craftImageMapper;
    @Mock
    private CraftContactMapper craftContactMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;

    @InjectMocks
    private CraftService craftService;

    @Test
    void detail_returnsModel3dFieldsFor3dCraft() {
        Craft craft = new Craft();
        craft.setId(3L);
        craft.setName("屯堡石雕·地戏面具");
        craft.setIntroZh("中文介绍");
        craft.setIntroEn("English intro");
        craft.setPreviewType("model3d");
        craft.setModel3dUrl("https://cdn.example.com/models/mask.glb");
        craft.setViewerEnabled(1);
        craft.setTransformJson("{\"scale\":1.1,\"offsetX\":0,\"offsetY\":0,\"offsetZ\":0}");
        craft.setStatus(1);
        craft.setCategoryId(12L);

        CraftImage image = new CraftImage();
        image.setImageUrl("https://cdn.example.com/mask.jpg");
        image.setAngleLabel("正面");

        CraftContact contact = new CraftContact();
        contact.setPhone("0851-12345678");
        contact.setWechat("shuyuan_craft");
        contact.setEmail("craft@gzjtzy.edu.cn");

        when(craftMapper.selectById(3L)).thenReturn(craft);
        when(craftImageMapper.selectList(any())).thenReturn(List.of(image));
        when(craftContactMapper.selectById(3L)).thenReturn(contact);
        when(categoryService.nameMap("craft")).thenReturn(Map.of(12L, "非遗工艺"));
        when(categoryService.getName(12L, Map.of(12L, "非遗工艺"))).thenReturn("非遗工艺");

        Map<String, Object> vo = craftService.detail(3L);

        assertEquals("model3d", vo.get("previewType"));
        assertEquals("https://cdn.example.com/models/mask.glb", vo.get("model3dUrl"));
        assertEquals(Boolean.TRUE, vo.get("viewerEnabled"));
        assertNotNull(vo.get("transform"));
        assertEquals("中文介绍", vo.get("introZh"));
        assertEquals("English intro", vo.get("introEn"));
        assertNotNull(vo.get("images"));
        assertNotNull(vo.get("contact"));
        verify(eventLogService).record("view", "craft", 3L);
    }

    @Test
    void detail_throwsWhenCraftMissing() {
        when(craftMapper.selectById(99L)).thenReturn(null);
        assertThrows(BusinessException.class, () -> craftService.detail(99L));
    }
}
