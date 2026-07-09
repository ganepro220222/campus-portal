package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.SubscribeRecordRequest;
import com.shuyuan.backend.service.SubscribeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "订阅消息")
@RestController
@RequestMapping("/api/v1/subscribe")
@RequiredArgsConstructor
public class SubscribeController {

    private final SubscribeService subscribeService;

    /** 小程序 wx.requestSubscribeMessage 前获取模板 ID */
    @GetMapping("/templates")
    public Result<Map<String, String>> templates() {
        return Result.ok(subscribeService.templateIds());
    }

    /** 上报用户授权结果（accept 时增加可发次数） */
    @PostMapping("/records")
    public Result<Void> record(@Valid @RequestBody SubscribeRecordRequest req) {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        subscribeService.recordAuthorization(memberId, req);
        return Result.ok();
    }
}
