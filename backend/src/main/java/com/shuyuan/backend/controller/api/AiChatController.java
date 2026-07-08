package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AiChatRequest;
import com.shuyuan.backend.service.AiChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "AI 文化问答")
@RestController
@RequestMapping("/api/v1/ai/chat/sessions")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping
    public Result<Map<String, Object>> createSession() {
        return Result.ok(aiChatService.createSession());
    }

    @GetMapping
    public Result<List<Map<String, Object>>> listSessions() {
        return Result.ok(aiChatService.listSessions());
    }

    @GetMapping("/{id}/messages")
    public Result<List<Map<String, Object>>> listMessages(@PathVariable Long id) {
        return Result.ok(aiChatService.listMessages(id));
    }

    @PostMapping("/{id}/messages")
    public Result<Map<String, Object>> chat(@PathVariable Long id, @Valid @RequestBody AiChatRequest req) {
        return Result.ok(aiChatService.chat(id, req));
    }
}
