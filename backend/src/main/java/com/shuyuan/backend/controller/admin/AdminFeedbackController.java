package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.FeedbackReplyRequest;
import com.shuyuan.backend.service.AdminFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "意见反馈管理")
@RestController
@RequestMapping("/api/v1/admin/feedbacks")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final AdminFeedbackService adminFeedbackService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return Result.ok(adminFeedbackService.list(page, size, status));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(adminFeedbackService.detail(id));
    }

    @PutMapping("/{id}/reply")
    public Result<Map<String, Object>> reply(@PathVariable Long id, @RequestBody FeedbackReplyRequest req) {
        return Result.ok(adminFeedbackService.reply(id, req));
    }
}
