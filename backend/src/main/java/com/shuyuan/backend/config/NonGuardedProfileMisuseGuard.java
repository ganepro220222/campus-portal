package com.shuyuan.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 防止 dev/docker 等非 guarded profile 连接远程 DB/Redis，从而绕过 staging/prod 启动门禁。
 */
@Component
@RequiredArgsConstructor
public class NonGuardedProfileMisuseGuard implements ApplicationRunner {

    private final Environment environment;

    @Override
    public void run(ApplicationArguments args) {
        DeploymentSecurityRules.validateNonGuardedProfileUsesLocalInfraOnly(
                environment.getActiveProfiles(),
                environment.getProperty("spring.datasource.url", ""),
                environment.getProperty("spring.data.redis.host", ""));
    }
}
