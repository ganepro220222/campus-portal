package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AiPolishRequest;
import com.shuyuan.backend.service.AdminAiPolishService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "AI 文案辅助")
@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
public class AdminAiController {

    private final AdminAiPolishService adminAiPolishService;

    @PostMapping("/polish")
    public Result<Map<String, Object>> polish(@Valid @RequestBody AiPolishRequest req) {
        return Result.ok(adminAiPolishService.polish(req));
    }
}
