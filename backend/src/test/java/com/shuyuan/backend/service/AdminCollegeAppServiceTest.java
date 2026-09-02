package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CollegeAppSaveRequest;
import com.shuyuan.backend.entity.CollegeApp;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCollegeAppServiceTest {

    @Mock
    private CollegeAppMapper collegeAppMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

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

    @Test
    void update_blankApiToken_preservesExistingSecret() {
        CollegeApp existing = apiSyncRow("old-secret");
        when(collegeAppMapper.selectById(1L)).thenReturn(existing);
        CollegeAppSaveRequest req = apiSyncRequest(" ");

        adminCollegeAppService.update(1L, req);

        assertEquals("old-secret", existing.getApiToken());
    }

    @Test
    void update_nonBlankApiToken_replacesExistingSecret() {
        CollegeApp existing = apiSyncRow("old-secret");
        when(collegeAppMapper.selectById(1L)).thenReturn(existing);
        CollegeAppSaveRequest req = apiSyncRequest("  new-secret  ");

        adminCollegeAppService.update(1L, req);

        assertEquals("new-secret", existing.getApiToken());
    }

    private static CollegeApp apiSyncRow(String token) {
        CollegeApp row = new CollegeApp();
        row.setId(1L);
        row.setName("接口学院");
        row.setContentType("api_sync");
        row.setContentUrl("https://example.com/api");
        row.setApiToken(token);
        return row;
    }

    private static CollegeAppSaveRequest apiSyncRequest(String token) {
        CollegeAppSaveRequest req = new CollegeAppSaveRequest();
        req.setName("接口学院");
        req.setContentType("api_sync");
        req.setContentUrl("https://example.com/api");
        req.setApiToken(token);
        return req;
    }
}
