package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CollegeAppSaveRequest;
import com.shuyuan.backend.entity.CollegeApp;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
        CollegeAppSaveRequest req = jumpRequest(null, 1);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminCollegeAppService.create(req));
        assertEquals(400, ex.getCode());
        assertEquals("跳转方式须填写目标小程序 AppID", ex.getMessage());
        verify(collegeAppMapper, never()).insert(any(CollegeApp.class));
    }

    @Test
    void create_jumpWithShortAppid_throws() {
        assertJumpRejected("wx532a624945bc769");
    }

    @Test
    void create_jumpWithLongAppid_throws() {
        assertJumpRejected("wx532a624945bc7691x");
    }

    @Test
    void create_jumpWithNonWxPrefix_throws() {
        assertJumpRejected("mp532a624945bc7691");
    }

    @Test
    void create_jumpWithNonHexAppid_throws() {
        assertJumpRejected("wx532a624945bc769g");
    }

    @Test
    void create_jumpWithExtraSuffix_throws() {
        assertJumpRejected("wx532a624945bc7691-extra");
    }

    @Test
    void create_embedH5WithoutAppid_allows() {
        CollegeAppSaveRequest req = new CollegeAppSaveRequest();
        req.setName("网页入口");
        req.setContentType("embed_h5");
        req.setContentUrl("https://example.com/page");
        when(collegeAppMapper.insert(any(CollegeApp.class))).thenAnswer(invocation -> {
            CollegeApp row = invocation.getArgument(0);
            row.setId(10L);
            return 1;
        });
        CollegeApp saved = new CollegeApp();
        saved.setId(10L);
        saved.setName("网页入口");
        saved.setContentType("embed_h5");
        saved.setContentUrl("https://example.com/page");
        when(collegeAppMapper.selectById(10L)).thenReturn(saved);

        Map<String, Object> vo = adminCollegeAppService.create(req);
        assertEquals("embed_h5", vo.get("contentType"));
    }

    @Test
    void create_jumpWithValidAppid_trimsAndSaves() {
        CollegeAppSaveRequest req = jumpRequest("  wx532a624945bc7691  ", 1);
        when(collegeAppMapper.insert(any(CollegeApp.class))).thenAnswer(invocation -> {
            CollegeApp row = invocation.getArgument(0);
            row.setId(8L);
            return 1;
        });
        CollegeApp saved = new CollegeApp();
        saved.setId(8L);
        saved.setName("通途星");
        saved.setContentType("jump");
        saved.setAppid("wx532a624945bc7691");
        saved.setStatus(1);
        when(collegeAppMapper.selectById(8L)).thenReturn(saved);

        Map<String, Object> vo = adminCollegeAppService.create(req);

        ArgumentCaptor<CollegeApp> captor = ArgumentCaptor.forClass(CollegeApp.class);
        verify(collegeAppMapper).insert(captor.capture());
        assertEquals("wx532a624945bc7691", captor.getValue().getAppid());
        assertEquals("fit", captor.getValue().getIconFitMode());
        assertEquals("square", captor.getValue().getIconShape());
        assertEquals("wx532a624945bc7691", vo.get("appid"));
    }

    @Test
    void create_savesCircleFillIconDisplay() {
        CollegeAppSaveRequest req = jumpRequest("wx532a624945bc7691", 1);
        req.setIconFitMode("fill");
        req.setIconShape("circle");
        when(collegeAppMapper.insert(any(CollegeApp.class))).thenAnswer(invocation -> {
            CollegeApp row = invocation.getArgument(0);
            row.setId(11L);
            return 1;
        });
        CollegeApp saved = new CollegeApp();
        saved.setId(11L);
        saved.setName("通途星");
        saved.setContentType("jump");
        saved.setAppid("wx532a624945bc7691");
        saved.setIconFitMode("fill");
        saved.setIconShape("circle");
        when(collegeAppMapper.selectById(11L)).thenReturn(saved);

        Map<String, Object> vo = adminCollegeAppService.create(req);

        ArgumentCaptor<CollegeApp> captor = ArgumentCaptor.forClass(CollegeApp.class);
        verify(collegeAppMapper).insert(captor.capture());
        assertEquals("fill", captor.getValue().getIconFitMode());
        assertEquals("circle", captor.getValue().getIconShape());
        assertEquals("fill", vo.get("iconFitMode"));
        assertEquals("circle", vo.get("iconShape"));
    }

    @Test
    void create_manualWithoutAppid_allows() {
        CollegeAppSaveRequest req = new CollegeAppSaveRequest();
        req.setName("简介入口");
        req.setContentType("manual");
        when(collegeAppMapper.insert(any(CollegeApp.class))).thenAnswer(invocation -> {
            CollegeApp row = invocation.getArgument(0);
            row.setId(9L);
            return 1;
        });
        CollegeApp saved = new CollegeApp();
        saved.setId(9L);
        saved.setName("简介入口");
        saved.setContentType("manual");
        when(collegeAppMapper.selectById(9L)).thenReturn(saved);

        Map<String, Object> vo = adminCollegeAppService.create(req);
        assertEquals("manual", vo.get("contentType"));
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

    private void assertJumpRejected(String appid) {
        CollegeAppSaveRequest req = jumpRequest(appid, 1);
        BusinessException ex = assertThrows(BusinessException.class, () -> adminCollegeAppService.create(req));
        assertEquals(400, ex.getCode());
        assertEquals("AppID 格式不正确，应为 wx 开头的 18 位小程序 AppID", ex.getMessage());
        verify(collegeAppMapper, never()).insert(any(CollegeApp.class));
    }

    private static CollegeAppSaveRequest jumpRequest(String appid, Integer status) {
        CollegeAppSaveRequest req = new CollegeAppSaveRequest();
        req.setName("通途星");
        req.setContentType("jump");
        req.setAppid(appid);
        req.setStatus(status);
        return req;
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
