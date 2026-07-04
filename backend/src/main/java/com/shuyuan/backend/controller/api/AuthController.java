package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.AccountLoginRequest;
import com.shuyuan.backend.dto.WxLoginRequest;
import com.shuyuan.backend.service.AuthService;
import com.shuyuan.backend.vo.LoginVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/wx-login")
    public Result<LoginVO> wxLogin(@Valid @RequestBody WxLoginRequest req) {
        return Result.ok(authService.wxLogin(req));
    }

    @PostMapping("/account-login")
    public Result<LoginVO> accountLogin(@Valid @RequestBody AccountLoginRequest req) {
        return Result.ok(authService.accountLogin(req));
    }
}
