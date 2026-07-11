package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HallMediaItem;
import com.shuyuan.backend.dto.HallSaveRequest;
import com.shuyuan.backend.dto.HallSectionItem;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.entity.HallSection;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import com.shuyuan.backend.mapper.HallSectionMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminHallServiceTest {

    @Mock
    private HallMapper hallMapper;
    @Mock
    private HallMediaMapper hallMediaMapper;
    @Mock
    private HallSectionMapper hallSectionMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;

    @InjectMocks
    private AdminHallService adminHallService;

    @Test
    void create_syncsSlidesAndAudio() {
        HallSaveRequest req = new HallSaveRequest();
        req.setName("节水宣传教育中心");
        req.setShortName("节水宣传中心");
        req.setVrUrl("https://www.720yun.com/vr/f7bj5pmOkO2");
        req.setCategoryId(18L);
        req.setStatus(1);

        HallMediaItem slide = new HallMediaItem();
        slide.setUrl("https://cdn.example.com/hall/water-1.jpg");
        slide.setCaption("节水宣传展板");
        req.setSlides(List.of(slide));
        req.setAudioUrl("https://cdn.example.com/hall/water.mp3");
        req.setAudioTime("语音讲解 02:10");

        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of(18L, "主题宣教"));
        when(categoryService.getName(18L, java.util.Map.of(18L, "主题宣教"))).thenReturn("主题宣教");

        doAnswer(inv -> {
            Hall hall = inv.getArgument(0);
            hall.setId(10L);
            return 1;
        }).when(hallMapper).insert(any(Hall.class));

        Hall saved = new Hall();
        saved.setId(10L);
        saved.setName("节水宣传教育中心");
        saved.setShortName("节水宣传中心");
        saved.setVrUrl("https://www.720yun.com/vr/f7bj5pmOkO2");
        saved.setCategoryId(18L);
        saved.setStatus(1);
        saved.setSort(0);
        when(hallMapper.selectById(10L)).thenReturn(saved);
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        adminHallService.create(req);

        verify(hallMediaMapper, times(2)).delete(any());
        verify(hallMediaMapper, times(2)).insert(any(HallMedia.class));
    }

    @Test
    void create_syncsSectionsWithMedia() {
        HallSaveRequest req = new HallSaveRequest();
        req.setName("校史馆");
        req.setStatus(1);

        HallSectionItem section = new HallSectionItem();
        section.setTitle("办学历程");
        section.setSort(1);
        HallMediaItem item = new HallMediaItem();
        item.setUrl("https://cdn.example.com/hall/sec.jpg");
        item.setCaption("建校初期");
        section.setItems(List.of(item));
        req.setSections(List.of(section));

        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of());
        doAnswer(inv -> {
            Hall hall = inv.getArgument(0);
            hall.setId(2L);
            return 1;
        }).when(hallMapper).insert(any(Hall.class));
        doAnswer(inv -> {
            HallSection sec = inv.getArgument(0);
            sec.setId(1L);
            return 1;
        }).when(hallSectionMapper).insert(any(HallSection.class));

        Hall saved = new Hall();
        saved.setId(2L);
        saved.setName("校史馆");
        saved.setStatus(1);
        saved.setSort(0);
        when(hallMapper.selectById(2L)).thenReturn(saved);
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        adminHallService.create(req);

        verify(hallSectionMapper).delete(any());
        verify(hallSectionMapper).insert(any(HallSection.class));
        verify(hallMediaMapper).delete(any());
        verify(hallMediaMapper).insert(any(HallMedia.class));
    }

    @Test
    void update_skipsMediaWhenPayloadOmitsSlidesAndAudio() {
        Hall existing = new Hall();
        existing.setId(3L);
        existing.setName("校史馆");
        existing.setStatus(1);
        when(hallMapper.selectById(3L)).thenReturn(existing);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of());
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        HallSaveRequest req = new HallSaveRequest();
        req.setName("校史馆（更新）");

        adminHallService.update(3L, req);

        verify(hallMediaMapper, never()).delete(any());
        verify(hallMediaMapper, never()).insert(any(HallMedia.class));
        verify(hallSectionMapper, never()).delete(any());
    }

    @Test
    void create_trimsVrUrlOnSave() {
        HallSaveRequest req = new HallSaveRequest();
        req.setName("校史馆");
        req.setVrUrl("  https://roma.720yun.com/vr/b5b7196093f3c25a/  ");
        req.setStatus(1);

        ArgumentCaptor<Hall> captor = ArgumentCaptor.forClass(Hall.class);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of());

        doAnswer(inv -> {
            Hall hall = inv.getArgument(0);
            hall.setId(2L);
            return 1;
        }).when(hallMapper).insert(captor.capture());

        Hall saved = new Hall();
        saved.setId(2L);
        saved.setName("校史馆");
        saved.setVrUrl("https://roma.720yun.com/vr/b5b7196093f3c25a/");
        saved.setStatus(1);
        saved.setSort(0);
        when(hallMapper.selectById(2L)).thenReturn(saved);
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        adminHallService.create(req);

        assertEquals("https://roma.720yun.com/vr/b5b7196093f3c25a/", captor.getValue().getVrUrl());
    }

    @Test
    void publish_setsOnlineAndSyncsSearch() {
        Hall offline = new Hall();
        offline.setId(7L);
        offline.setName("交通博物馆");
        offline.setStatus(0);
        Hall online = new Hall();
        online.setId(7L);
        online.setName("交通博物馆");
        online.setStatus(1);
        when(hallMapper.selectById(7L)).thenReturn(offline, online, online);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of());
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        adminHallService.publish(7L);

        verify(searchIndexSyncService).syncHall(online);
    }

    @Test
    void unpublish_setsOfflineAndRemovesSearch() {
        Hall online = new Hall();
        online.setId(8L);
        online.setName("校史馆");
        online.setStatus(1);
        Hall offline = new Hall();
        offline.setId(8L);
        offline.setName("校史馆");
        offline.setStatus(0);
        when(hallMapper.selectById(8L)).thenReturn(online, offline, offline);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of());
        when(hallMediaMapper.selectList(any())).thenReturn(List.of());
        when(hallSectionMapper.selectList(any())).thenReturn(List.of());

        adminHallService.unpublish(8L);

        verify(searchIndexSyncService).removeHall(8L);
    }

    @Test
    void publish_rejectsAlreadyOnline() {
        Hall online = new Hall();
        online.setId(9L);
        online.setStatus(1);
        when(hallMapper.selectById(9L)).thenReturn(online);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminHallService.publish(9L));

        assertEquals(400, ex.getCode());
        verify(searchIndexSyncService, never()).syncHall(any());
    }
}
