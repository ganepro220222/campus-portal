package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HallServiceTest {

    @Mock
    private HallMapper hallMapper;
    @Mock
    private HallMediaMapper hallMediaMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;

    @InjectMocks
    private HallService hallService;

    @Test
    void resolveShortName_prefersConfiguredShortName() {
        Hall hall = new Hall();
        hall.setName("西部山区道路运输安全警示教育基地");
        hall.setShortName("西部山区安全基地");
        assertEquals("西部山区安全基地", HallService.resolveShortName(hall));
    }

    @Test
    void isVrReady_requiresHttpsUrl() {
        assertTrue(HallService.isVrReady("https://roma.720yun.com/vr/abc/"));
        assertFalse(HallService.isVrReady(""));
        assertFalse(HallService.isVrReady("http://example.com"));
    }

    @Test
    void detail_returnsVrFieldsAndSlides() {
        Hall hall = new Hall();
        hall.setId(1L);
        hall.setName("校史馆");
        hall.setShortName("校史馆");
        hall.setIntro("简介");
        hall.setVrUrl("https://roma.720yun.com/vr/b5b7196093f3c25a/");
        hall.setCategoryId(4L);
        hall.setStatus(1);

        HallMedia image = new HallMedia();
        image.setMediaType("image");
        image.setUrl("https://cdn.example.com/hall/1.jpg");
        image.setCaption("校史展厅入口");
        image.setSort(1);

        when(hallMapper.selectById(1L)).thenReturn(hall);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of(4L, "博物馆与校史"));
        when(categoryService.getName(4L, java.util.Map.of(4L, "博物馆与校史"))).thenReturn("博物馆与校史");
        when(hallMediaMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(image));

        var detail = hallService.detail(1L);
        assertEquals("校史馆", detail.get("name"));
        assertEquals("https://roma.720yun.com/vr/b5b7196093f3c25a/", detail.get("vrUrl"));
        assertEquals(true, detail.get("vrReady"));
        assertEquals(1, ((List<?>) detail.get("slides")).size());
        assertEquals("校史展厅入口", detail.get("caption"));
    }

    @Test
    void detail_throwsWhenHallOffline() {
        Hall hall = new Hall();
        hall.setId(2L);
        hall.setStatus(0);
        when(hallMapper.selectById(2L)).thenReturn(hall);

        BusinessException ex = assertThrows(BusinessException.class, () -> hallService.detail(2L));
        assertEquals(404, ex.getCode());
    }
}
