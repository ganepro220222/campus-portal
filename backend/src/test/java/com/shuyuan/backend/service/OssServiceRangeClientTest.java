package com.shuyuan.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.mapper.OssObjectMetaMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OssServiceRangeClientTest {

    @Test
    void rangeClient_isReusedAndClosedOnlyAtServiceShutdown() {
        OssProperties properties = mock(OssProperties.class);
        OSS client = mock(OSS.class);
        OssService service = spy(new OssService(properties, mock(OssObjectMetaMapper.class)));
        doReturn(client).when(service).buildTransferClient();

        assertSame(client, service.getRangeTransferClient());
        assertSame(client, service.getRangeTransferClient());
        verify(service, times(1)).buildTransferClient();

        service.shutdownRangeResources();
        verify(client).shutdown();
    }

    @Test
    void rangeMetadata_isCachedForRepeatedChunksOfSameObject() {
        OssProperties properties = mock(OssProperties.class);
        when(properties.getBucket()).thenReturn("bucket");
        OSS client = mock(OSS.class);
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(33_132_336L);
        metadata.setContentType("application/pdf");
        when(client.getObjectMetadata("bucket", "files/a.pdf")).thenReturn(metadata);
        OssService service = new OssService(properties, mock(OssObjectMetaMapper.class));

        OssService.RangeObjectMetadata first =
                service.getRangeObjectMetadata(client, "files/a.pdf");
        OssService.RangeObjectMetadata second =
                service.getRangeObjectMetadata(client, "files/a.pdf");

        assertSame(first, second);
        assertEquals(33_132_336L, second.contentLength());
        assertEquals("application/pdf", second.contentType());
        verify(client, times(1)).getObjectMetadata("bucket", "files/a.pdf");
    }
}
