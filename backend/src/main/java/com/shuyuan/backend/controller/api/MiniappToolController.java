package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.WxQrcodeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "小程序工具")
@RestController
@RequestMapping("/api/v1/miniapp")
@RequiredArgsConstructor
public class MiniappToolController {

    private final WxQrcodeService wxQrcodeService;

    /**
     * 获取小程序码 PNG（Base64）。dev-mode 或未配置微信凭证时 available=false，前端降级绘制占位图。
     */
    @GetMapping("/wxacode")
    public Result<Map<String, Object>> wxacode(
            @RequestParam(defaultValue = "pages/index/index") String path,
            @RequestParam(defaultValue = "280") int width) {
        byte[] png = wxQrcodeService.getWxaCode(path, width);
        Map<String, Object> m = new HashMap<>();
        if (png == null || png.length == 0) {
            m.put("available", false);
            m.put("reason", "dev-mode-or-missing-credentials");
            return Result.ok(m);
        }
        m.put("available", true);
        m.put("contentType", "image/png");
        m.put("imageBase64", Base64.getEncoder().encodeToString(png));
        m.put("path", path);
        return Result.ok(m);
    }
}
