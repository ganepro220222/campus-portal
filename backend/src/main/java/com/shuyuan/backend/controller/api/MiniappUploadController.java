package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.service.OssService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "小程序上传")
@RestController
@RequestMapping("/api/v1/miniapp")
@RequiredArgsConstructor
public class MiniappUploadController {

    private final OssService ossService;

    /** 会员端图片上传（意见反馈附图等），需登录 */
    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (MemberContext.getMemberId() == null) {
            throw new BusinessException(401, "请先登录");
        }
        return Result.ok(ossService.upload("feedback", file));
    }
}
