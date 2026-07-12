package com.shuyuan.backend.service;

import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.DownloadRecord;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.DownloadRecordMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceMapper resourceMapper;
    @Mock
    private DownloadRecordMapper downloadRecordMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private EventLogService eventLogService;
    @Mock
    private PointService pointService;
    @Mock
    private OssService ossService;

    @InjectMocks
    private ResourceService resourceService;

    private static final Long MEMBER_ID = 7L;
    private static final Long RESOURCE_ID = 3L;

    @BeforeEach
    void login() {
        MemberContext.setMemberId(MEMBER_ID);
    }

    @AfterEach
    void clear() {
        MemberContext.clear();
    }

    @Test
    void download_recordsAndIncrementsAtomically() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);
        when(resourceMapper.incrDownloadCount(RESOURCE_ID)).thenReturn(1);
        when(ossService.signUrl(anyString())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = resourceService.download(RESOURCE_ID);

        assertEquals("pdf", result.get("fileType"));
        verify(downloadRecordMapper).insert(any(DownloadRecord.class));
        verify(eventLogService).record("download", "resource", RESOURCE_ID);
        verify(pointService).award(MEMBER_ID, "download_resource");
        verify(resourceMapper).incrDownloadCount(RESOURCE_ID);
        verify(resourceMapper, never()).updateById(any(Resource.class));
    }

    @Test
    void download_requiresLogin() {
        MemberContext.clear();
        var ex = assertThrows(BusinessException.class, () -> resourceService.download(RESOURCE_ID));
        assertEquals(401, ex.getCode());
        verifyNoInteractions(downloadRecordMapper);
    }

    @Test
    void download_failsWhenIncrReturnsZero() {
        Resource resource = activeResource();
        when(resourceMapper.selectById(RESOURCE_ID)).thenReturn(resource);
        when(resourceMapper.incrDownloadCount(RESOURCE_ID)).thenReturn(0);

        var ex = assertThrows(BusinessException.class, () -> resourceService.download(RESOURCE_ID));
        assertEquals(404, ex.getCode());

        ArgumentCaptor<DownloadRecord> captor = ArgumentCaptor.forClass(DownloadRecord.class);
        verify(downloadRecordMapper).insert(captor.capture());
        assertEquals(MEMBER_ID, captor.getValue().getMemberId());
    }

    private Resource activeResource() {
        Resource resource = new Resource();
        resource.setId(RESOURCE_ID);
        resource.setName("测试.pdf");
        resource.setFileUrl("https://cdn.example.com/test.pdf");
        resource.setPreviewUrl("https://cdn.example.com/test.pdf");
        resource.setFileType("pdf");
        resource.setStatus(1);
        resource.setDownloadCount(10);
        return resource;
    }
}
