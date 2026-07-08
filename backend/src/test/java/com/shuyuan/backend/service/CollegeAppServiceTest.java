package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.CollegeApp;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeAppServiceTest {

    @Mock
    private CollegeAppMapper collegeAppMapper;

    @InjectMocks
    private CollegeAppService collegeAppService;

    @Test
    void deriveShort_stripsCollegeSuffix() {
        assertEquals("轨道", CollegeAppService.deriveShort("轨道交通学院"));
        assertEquals("马", CollegeAppService.deriveShort("马克思主义学院"));
    }

    @Test
    void listActive_returnsOnlyPublished() {
        CollegeApp on = new CollegeApp();
        on.setId(1L);
        on.setName("轨道交通学院");
        on.setDescription("智慧运维");
        on.setSort(1);
        on.setStatus(1);
        on.setContentType("manual");
        when(collegeAppMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(on));

        var list = collegeAppService.listActive();
        assertEquals(1, list.size());
        assertEquals("轨道交通学院", list.get(0).get("name"));
        assertEquals("轨道", list.get(0).get("short"));
        assertTrue(list.get(0).containsKey("colorClass"));
    }
}
