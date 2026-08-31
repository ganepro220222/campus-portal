package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ResourceSaveRequest;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminResourceServiceTest {

    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private SearchIndexSyncService searchIndexSyncService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

    @InjectMocks
    private AdminResourceService adminResourceService;

    @Test
    void publish_setsOnlineAndSyncsSearch() {
        Resource offline = new Resource();
        offline.setId(21L);
        offline.setName("节水手册");
        offline.setStatus(0);
        Resource online = new Resource();
        online.setId(21L);
        online.setName("节水手册");
        online.setStatus(1);
        when(resourceMapper.selectById(21L)).thenReturn(offline, online, online);
        when(categoryService.nameMap("resource")).thenReturn(java.util.Map.of());

        adminResourceService.publish(21L);

        verify(searchIndexSyncService).syncResource(online);
    }

    @Test
    void unpublish_removesSearchIndex() {
        Resource online = new Resource();
        online.setId(22L);
        online.setName("安全读本");
        online.setStatus(1);
        Resource offline = new Resource();
        offline.setId(22L);
        offline.setName("安全读本");
        offline.setStatus(0);
        when(resourceMapper.selectById(22L)).thenReturn(online, offline, offline);
        when(categoryService.nameMap("resource")).thenReturn(java.util.Map.of());

        adminResourceService.unpublish(22L);

        verify(searchIndexSyncService).removeResource(22L);
    }

    @Test
    void unpublish_rejectsAlreadyOffline() {
        Resource offline = new Resource();
        offline.setId(23L);
        offline.setStatus(0);
        when(resourceMapper.selectById(23L)).thenReturn(offline);

        BusinessException ex = assertThrows(BusinessException.class, () -> adminResourceService.unpublish(23L));

        assertEquals(400, ex.getCode());
        verify(searchIndexSyncService, never()).removeResource(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"xls", "xlsx"})
    void create_acceptsExcelResourceTypes(String fileType) {
        java.util.concurrent.atomic.AtomicReference<Resource> inserted =
                new java.util.concurrent.atomic.AtomicReference<>();
        doAnswer(invocation -> {
            Resource resource = invocation.getArgument(0);
            resource.setId(30L);
            inserted.set(resource);
            return 1;
        }).when(resourceMapper).insert(any(Resource.class));
        when(resourceMapper.selectById(30L)).thenAnswer(invocation -> inserted.get());
        when(categoryService.nameMap("resource")).thenReturn(java.util.Map.of());

        ResourceSaveRequest request = new ResourceSaveRequest();
        request.setName("课程安排表");
        request.setFileUrl("https://cdn.example.com/files/202609/schedule." + fileType);
        request.setFileType(fileType);
        request.setStatus(0);

        var result = adminResourceService.create(request);

        assertEquals(fileType, result.get("fileType"));
        verify(resourceMapper).insert(argThat(
                (Resource resource) -> fileType.equals(resource.getFileType())));
    }
}
