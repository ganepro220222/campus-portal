package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CraftSaveRequest;
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
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

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

    @Test
    void createAndUpdate_ignoreRequestedOnlineStatus() {
        java.util.concurrent.atomic.AtomicReference<Craft> stored = new java.util.concurrent.atomic.AtomicReference<>();
        doAnswer(invocation -> {
            Craft craft = invocation.getArgument(0);
            craft.setId(4L);
            stored.set(craft);
            return 1;
        }).when(craftMapper).insert(any(Craft.class));
        when(craftMapper.selectById(4L)).thenAnswer(invocation -> stored.get());
        when(categoryService.nameMap("craft")).thenReturn(java.util.Map.of());
        when(craftImageMapper.selectList(any())).thenReturn(List.of());
        when(craftContactMapper.selectById(4L)).thenReturn(null);
        CraftSaveRequest create = new CraftSaveRequest();
        create.setName("待审核文创");
        create.setStatus(1);

        adminCraftService.create(create);

        assertEquals(0, stored.get().getStatus());
        CraftSaveRequest update = new CraftSaveRequest();
        update.setName("只改名称");
        update.setStatus(1);
        adminCraftService.update(4L, update);
        assertEquals(0, stored.get().getStatus());
        verify(searchIndexSyncService, never()).syncCraft(any());
    }
}
