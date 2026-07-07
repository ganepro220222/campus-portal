package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.OssService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 管理端媒体上传（OSS 中转兜底，大文件建议后续接 STS 直传）
 */
@RestController
@RequestMapping("/api/v1/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {

    private final OssService ossService;
    private final AdminPermissionService adminPermissionService;

    @PostMapping
    public Result<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scene", defaultValue = "image") String scene) {
        adminPermissionService.requireAny("course:write", "hall:write", "news:write", "admin:super");
        return Result.ok(ossService.upload(scene, file));
    }
}
