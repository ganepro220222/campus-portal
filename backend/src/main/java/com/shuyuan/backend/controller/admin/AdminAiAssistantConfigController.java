package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AiAssistantConfigSaveRequest;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.SysConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "AI 助手配置")
@RestController
@RequestMapping("/api/v1/admin/ai-assistant-config")
@RequiredArgsConstructor
public class AdminAiAssistantConfigController {

    private final SysConfigService sysConfigService;
    private final AdminPermissionService adminPermissionService;

    @GetMapping
    public Result<Map<String, Object>> get() {
        adminPermissionService.require("admin:super");
        return Result.ok(sysConfigService.getAiAssistantAdminConfig());
    }

    @PutMapping
    public Result<Map<String, Object>> save(@Valid @RequestBody AiAssistantConfigSaveRequest req) {
        adminPermissionService.require("admin:super");
        sysConfigService.saveAiAssistantAdminConfig(
                req.getWelcomeText(), req.getSuggestQuestions(), req.getSearchHotTags());
        return Result.ok(sysConfigService.getAiAssistantAdminConfig());
    }
}
