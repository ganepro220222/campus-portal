package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.ContentDocSaveRequest;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.SysConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "协议内容管理")
@RestController
@RequestMapping("/api/v1/admin/content-docs")
@RequiredArgsConstructor
public class AdminContentDocController {

    private final SysConfigService sysConfigService;
    private final AdminPermissionService adminPermissionService;

    @GetMapping
    public Result<Map<String, Object>> get() {
        adminPermissionService.require("admin:super");
        return Result.ok(sysConfigService.getContentDocs());
    }

    @PutMapping
    public Result<Map<String, Object>> save(@RequestBody ContentDocSaveRequest req) {
        adminPermissionService.require("admin:super");
        sysConfigService.saveContentDocs(req.getPrivacy(), req.getAgreement());
        return Result.ok(sysConfigService.getContentDocs());
    }
}
