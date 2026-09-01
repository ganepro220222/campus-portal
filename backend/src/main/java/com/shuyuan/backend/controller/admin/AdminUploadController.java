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

    /**
     * 按落库地址反查上传时的原始文件名 / 大小 / 时间。
     * OSS 对象名是 32 位 hex，不反查的话后台刷新后只能显示「PDF 文件」这种占位。
     * 查不到返回空对象（老库历史文件本来就没有记录），前端自行退回按后缀显示。
     */
    @GetMapping("/file-meta")
    public Result<Map<String, Object>> fileMeta(@RequestParam("url") String url) {
        return Result.ok(ossService.objectMeta(url));
    }

    /**
     * 读取字幕正文供后台预览框展示前几条。
     * 字幕是 ASR 生成的，可能整份为空或乱码，只显示「字幕 VTT」根本看不出来。
     * 仅限 .vtt/.srt，见 OssService#subtitlePreview。
     */
    @GetMapping("/subtitle-preview")
    public Result<Map<String, Object>> subtitlePreview(@RequestParam("url") String url) {
        requireUploadPermission();
        return Result.ok(ossService.subtitlePreview(url));
    }

    private void requireUploadPermission() {
        adminPermissionService.requireAny("course:write", "hall:write", "news:write", "admin:super");
    }
}
