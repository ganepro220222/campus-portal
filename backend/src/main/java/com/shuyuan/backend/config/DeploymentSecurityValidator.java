package com.shuyuan.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * staging/prod 启动前校验：禁止 dev JWT、禁止微信 dev-mode、生产要求 WX 凭证。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeploymentSecurityValidator implements ApplicationRunner {

    private final Environment environment;
    private final ShuyuanProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        String[] profiles = environment.getActiveProfiles();
        if (!DeploymentSecurityRules.requiresGuardedValidation(profiles)) {
            return;
        }
        DeploymentSecurityRules.validateGuardedDeployment(
                profiles,
                properties.getJwt().getSecret(),
                properties.getWx().isDevMode(),
                properties.getWx().getAppid(),
                properties.getWx().getSecret());
        log.info("部署安全校验通过，activeProfiles={}", String.join(",", profiles));
    }
}
