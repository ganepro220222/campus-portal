package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.SysConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@Tag(name = "公开配置")
@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
public class PublicConfigController {

    private final SysConfigService sysConfigService;

    @GetMapping("/miniapp")
    public Result<Map<String, Object>> miniapp() {
        return Result.ok(sysConfigService.getMiniappPublicConfig());
    }

    @GetMapping("/documents")
    public Result<Map<String, Object>> documents() {
        return Result.ok(sysConfigService.getContentDocs());
    }
}
