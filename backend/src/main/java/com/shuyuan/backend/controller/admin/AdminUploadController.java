package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.OssDirectCompleteRequest;
import com.shuyuan.backend.dto.OssDirectPolicyRequest;
import com.shuyuan.backend.service.AdminPermissionService;
import com.shuyuan.backend.service.OssService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "媒体上传")

/**
 * 管理端媒体上传。小文件走 OSS 中转；视频在开关打开后走 PostObject 直传。
 */
@RestController
@RequestMapping("/api/v1/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {

    private final OssService ossService;
    private final AdminPermissionService adminPermissionService;

    @GetMapping("/capabilities")
    public Result<Map<String, Object>> capabilities() {
        requireUploadPermission();
        return Result.ok(ossService.uploadCapabilities());
    }

    @PostMapping
    public Result<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scene", defaultValue = "image") String scene) {
        requireUploadPermission();
        return Result.ok(ossService.upload(scene, file));
    }

    @PostMapping("/direct-policy")
    public Result<Map<String, String>> directPolicy(@Valid @RequestBody OssDirectPolicyRequest req) {
        requireUploadPermission();
        return Result.ok(ossService.createDirectPolicy(req.getScene(), req.getFileName(), req.getSize()));
    }

    @PostMapping("/complete")
    public Result<Map<String, String>> complete(@Valid @RequestBody OssDirectCompleteRequest req) {
        requireUploadPermission();
        return Result.ok(ossService.completeDirectUpload(req.getScene(), req.getObjectKey(), req.getSize()));
    }

    /**
     * 表单里保存的是不带签名的原始地址；CDN 开启 URL 鉴权后直接播放会 403。
     * 预览前用本接口换取短时签名地址，不改变落库值。只读操作，登录管理员即可。
     */
    @GetMapping("/preview-url")
    public Result<Map<String, String>> previewUrl(@RequestParam("url") String url) {
        String signed = ossService.signUrl(url);
        return Result.ok(Map.of("url", signed == null ? "" : signed));
    }

    private void requireUploadPermission() {
        adminPermissionService.requireAny("course:write", "hall:write", "news:write", "admin:super");
    }
}
