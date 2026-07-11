package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftImageMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCraftServiceTest {

    @Mock
    private CraftMapper craftMapper;
    @Mock
    private CraftImageMapper craftImageMapper;
    @Mock
    private CraftContactMapper craftContactMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;

    @InjectMocks
    private AdminCraftService adminCraftService;

    @Test
    void publish_setsOnlineAndSyncsSearch() {
        Craft offline = new Craft();
        offline.setId(1L);
        offline.setName("青花瓷");
        offline.setStatus(0);
        Craft online = new Craft();
        online.setId(1L);
        online.setName("青花瓷");
        online.setStatus(1);
        when(craftMapper.selectById(1L)).thenReturn(offline, online, online);
        when(categoryService.nameMap("craft")).thenReturn(java.util.Map.of());
        when(craftImageMapper.selectList(any())).thenReturn(List.of());
        when(craftContactMapper.selectById(1L)).thenReturn(null);

        adminCraftService.publish(1L);

        verify(searchIndexSyncService).syncCraft(online);
    }

    @Test
    void unpublish_removesSearchIndex() {
        Craft online = new Craft();
        online.setId(2L);
        online.setName("剪纸");
        online.setStatus(1);
        Craft offline = new Craft();
        offline.setId(2L);
        offline.setName("剪纸");
        offline.setStatus(0);
        when(craftMapper.selectById(2L)).thenReturn(online, offline, offline);
        when(categoryService.nameMap("craft")).thenReturn(java.util.Map.of());
        when(craftImageMapper.selectList(any())).thenReturn(List.of());
        when(craftContactMapper.selectById(2L)).thenReturn(null);

        adminCraftService.unpublish(2L);

        verify(searchIndexSyncService).removeCraft(2L);
    }

    @Test
    void unpublish_rejectsAlreadyOffline() {
        Craft offline = new Craft();
        offline.setId(3L);
        offline.setStatus(0);
        when(craftMapper.selectById(3L)).thenReturn(offline);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminCraftService.unpublish(3L));

        assertEquals(400, ex.getCode());
        verify(searchIndexSyncService, never()).removeCraft(any());
    }
}
