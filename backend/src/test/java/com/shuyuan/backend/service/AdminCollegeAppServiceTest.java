package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CollegeAppSaveRequest;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;

@ExtendWith(MockitoExtension.class)
class AdminCollegeAppServiceTest {

    @Mock
    private CollegeAppMapper collegeAppMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminCollegeAppService adminCollegeAppService;

    @BeforeEach
    void setUp() {
        doNothing().when(adminPermissionService).require("admin:super");
    }

    @Test
    void create_jumpWithoutAppid_throws() {
        CollegeAppSaveRequest req = new CollegeAppSaveRequest();
        req.setName("测试学院");
        req.setContentType("jump");

        BusinessException ex = assertThrows(BusinessException.class, () -> adminCollegeAppService.create(req));
        assertEquals(400, ex.getCode());
    }
}
