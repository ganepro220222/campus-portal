package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HallMedia;
import com.shuyuan.backend.entity.HallSection;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HallMediaMapper;
import com.shuyuan.backend.mapper.HallSectionMapper;
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
    private HallSectionMapper hallSectionMapper;
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
    void buildSectionViews_groupsMediaBySection() {
        HallSection s1 = new HallSection();
        s1.setId(10L);
        s1.setTitle("办学历程");
        s1.setSort(1);

        HallMedia top = new HallMedia();
        top.setMediaType("image");
        top.setUrl("https://cdn.example.com/top.jpg");
        top.setSectionId(null);

        HallMedia secImg = new HallMedia();
        secImg.setMediaType("image");
        secImg.setSectionId(10L);
        secImg.setUrl("https://cdn.example.com/sec.jpg");
        secImg.setCaption("建校初期");
        secImg.setSort(1);

        var sections = HallService.buildSectionViews(List.of(s1), List.of(top, secImg));
        assertEquals(1, sections.size());
        assertEquals("办学历程", sections.get(0).get("title"));
        assertEquals(1, ((List<?>) sections.get(0).get("items")).size());
    }

    @Test
    void detail_returnsVrFieldsSlidesAndSections() {
        Hall hall = new Hall();
        hall.setId(2L);
        hall.setName("校史馆");
        hall.setShortName("校史馆");
        hall.setIntro("简介");
        hall.setVrUrl("https://roma.720yun.com/vr/b5b7196093f3c25a/");
        hall.setCategoryId(4L);
        hall.setStatus(1);

        HallSection section = new HallSection();
        section.setId(1L);
        section.setTitle("办学历程");
        section.setSort(1);

        HallMedia topImage = new HallMedia();
        topImage.setMediaType("image");
        topImage.setUrl("https://cdn.example.com/hall/top.jpg");
        topImage.setCaption("校史展厅入口");
        topImage.setSort(1);

        HallMedia sectionImage = new HallMedia();
        sectionImage.setMediaType("image");
        sectionImage.setSectionId(1L);
        sectionImage.setUrl("https://cdn.example.com/hall/sec.jpg");
        sectionImage.setCaption("建校初期");
        sectionImage.setSort(1);

        when(hallMapper.selectById(2L)).thenReturn(hall);
        when(categoryService.nameMap("hall")).thenReturn(java.util.Map.of(4L, "博物馆与校史"));
        when(categoryService.getName(4L, java.util.Map.of(4L, "博物馆与校史"))).thenReturn("博物馆与校史");
        when(hallSectionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(section));
        when(hallMediaMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(topImage, sectionImage));

        var detail = hallService.detail(2L);
        assertEquals("校史馆", detail.get("name"));
        assertEquals(1, ((List<?>) detail.get("slides")).size());
        assertEquals(1, ((List<?>) detail.get("sections")).size());
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
