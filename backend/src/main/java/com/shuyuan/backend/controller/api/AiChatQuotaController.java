package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.AiChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "AI 文化问答")
@RestController
@RequestMapping("/api/v1/ai/chat")
@RequiredArgsConstructor
public class AiChatQuotaController {

    private final AiChatService aiChatService;

    @GetMapping("/quota")
    public Result<Map<String, Object>> quota() {
        return Result.ok(aiChatService.quota());
    }
}
