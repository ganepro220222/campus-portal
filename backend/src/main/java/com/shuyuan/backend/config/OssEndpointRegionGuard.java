package com.shuyuan.backend.config;

import com.shuyuan.backend.util.OssEndpointSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时核对 OSS 公网 / 内网 Endpoint 是否同一地域，避免「外网贵州、内网成都」这种可复制错误。
 */
@Component
@RequiredArgsConstructor
public class OssEndpointRegionGuard implements ApplicationRunner {

    private final OssProperties ossProperties;

    @Override
    public void run(ApplicationArguments args) {
        if (!ossProperties.isEnabled()) {
            return;
        }
        OssEndpointSupport.assertSameRegion(
                ossProperties.getEndpoint(), ossProperties.getInternalEndpoint());
    }
}
