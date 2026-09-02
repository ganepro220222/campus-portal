package com.shuyuan.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * staging/prod 启动前强校验；本地 profile 使用公开开发 JWT 时仅告警，不阻断开发。
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
            if (!DeploymentSecurityRules.hasTestProfile(profiles)
                    && DeploymentSecurityRules.isKnownInsecureJwtSecret(
                    properties.getJwt().getSecret())) {
                log.warn("当前本地 profile 使用公开开发 JWT 密钥，仅可用于本机开发；"
                                + "共享环境请通过 JWT_SECRET 配置随机强密钥。activeProfiles={}",
                        String.join(",", profiles));
            }
            return;
        }
        DeploymentSecurityRules.validateGuardedDeployment(
                profiles,
                properties.getJwt().getSecret(),
                properties.getWx().isDevMode(),
                properties.getWx().getAppid(),
                properties.getWx().getSecret());
        CorsOriginPolicy.validateGuardedCorsOrigins(
                profiles,
                properties.getCors().getAllowedOriginPatterns());
        log.info("部署安全校验通过，activeProfiles={}", String.join(",", profiles));
    }
}
