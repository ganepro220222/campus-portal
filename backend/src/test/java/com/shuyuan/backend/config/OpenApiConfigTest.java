package com.shuyuan.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;
import org.springdoc.core.models.GroupedOpenApi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenApiConfigTest {

    private final OpenApiConfig config = new OpenApiConfig();

    @Test
    void openApi_hasTitleAndBearerAuth() {
        OpenAPI api = config.openAPI();
        assertEquals("云端书院 API", api.getInfo().getTitle());
        assertNotNull(api.getComponents().getSecuritySchemes().get("BearerAuth"));
        assertTrue(api.getSecurity().stream()
                .anyMatch(s -> s.containsKey("BearerAuth")));
    }

    @Test
    void groupedApis_splitMiniappAndAdmin() {
        GroupedOpenApi miniapp = config.miniappApi();
        GroupedOpenApi admin = config.adminApi();
        assertEquals("miniapp", miniapp.getGroup());
        assertEquals("admin", admin.getGroup());
        assertTrue(miniapp.getPathsToMatch().get(0).contains("/api/v1"));
        assertTrue(admin.getPathsToMatch().get(0).contains("/admin"));
    }
}
