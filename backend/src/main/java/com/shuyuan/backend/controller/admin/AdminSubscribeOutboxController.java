package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.AdminSubscribeOutboxService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "订阅消息发件箱")
@RestController
@RequestMapping("/api/v1/admin/subscribe-outbox")
@RequiredArgsConstructor
public class AdminSubscribeOutboxController {

    private final AdminSubscribeOutboxService adminSubscribeOutboxService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return Result.ok(adminSubscribeOutboxService.list(page, size, status));
    }

    /** 重新发送一条失败/跳过的通知：放回队列，worker 下一轮取走 */
    @PostMapping("/{id}/retry")
    public Result<Void> retry(@PathVariable Long id) {
        adminSubscribeOutboxService.retry(id);
        return Result.ok();
    }
}
