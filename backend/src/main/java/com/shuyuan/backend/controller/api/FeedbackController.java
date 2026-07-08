package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.FeedbackSubmitRequest;
import com.shuyuan.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "意见反馈")
@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public Result<Map<String, Object>> submit(@RequestBody FeedbackSubmitRequest req) {
        return Result.ok(feedbackService.submit(req));
    }
}
