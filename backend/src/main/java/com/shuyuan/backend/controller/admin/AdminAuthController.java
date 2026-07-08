package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AdminLoginRequest;
import com.shuyuan.backend.service.AdminAuthService;
import com.shuyuan.backend.vo.AdminLoginVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "管理端登录")
@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public Result<AdminLoginVO> login(@Valid @RequestBody AdminLoginRequest req) {
        return Result.ok(adminAuthService.login(req));
    }
}
