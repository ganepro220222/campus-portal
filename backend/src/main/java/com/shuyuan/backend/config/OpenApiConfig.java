package com.shuyuan.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 文档配置（对照 E2-4、交付物 §5）
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String bearer = "BearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("云端书院 API")
                        .description("贵州交通职业大学 · 云端书院小程序与管理后台接口。"
                                + "小程序前缀 /api/v1；管理端前缀 /api/v1/admin。"
                                + "需登录接口在 Header 携带 Authorization: Bearer {token}。")
                        .version("1.0")
                        .contact(new Contact().name("云端书院开发团队")))
                .addSecurityItem(new SecurityRequirement().addList(bearer))
                .components(new Components()
                        .addSecuritySchemes(bearer, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("小程序或管理端登录后返回的 token")));
    }

    /** 小程序端接口分组 */
    @Bean
    public GroupedOpenApi miniappApi() {
        return GroupedOpenApi.builder()
                .group("miniapp")
                .displayName("小程序 API")
                .pathsToMatch("/api/v1/**")
                .pathsToExclude("/api/v1/admin/**")
                .build();
    }

    /** 管理后台接口分组 */
    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .displayName("管理后台 API")
                .pathsToMatch("/api/v1/admin/**")
                .build();
    }
}
