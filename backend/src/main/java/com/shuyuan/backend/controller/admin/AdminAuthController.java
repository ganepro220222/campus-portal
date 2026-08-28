package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.common.context.AdminContext;
import com.shuyuan.backend.dto.AdminChangePasswordRequest;
import com.shuyuan.backend.dto.AdminLoginRequest;
import com.shuyuan.backend.service.AdminAuthService;
import com.shuyuan.backend.vo.AdminLoginVO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "管理端登录")
@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @GetMapping("/session")
    public Result<Map<String, Object>> session() {
        Long adminId = AdminContext.getAdminId();
        if (adminId == null) {
            return Result.fail(401, "请先登录管理后台");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("loggedIn", true);
        body.put("adminId", adminId);
        body.put("mustChangePassword", adminAuthService.mustChangePassword(adminId));
        return Result.ok(body);
    }

    @PostMapping("/login")
    public Result<AdminLoginVO> login(@Valid @RequestBody AdminLoginRequest req) {
        return Result.ok(adminAuthService.login(req));
    }

    @PutMapping("/change-password")
    public Result<AdminLoginVO> changePassword(@Valid @RequestBody AdminChangePasswordRequest req) {
        Long adminId = AdminContext.getAdminId();
        return Result.ok(adminAuthService.changePassword(adminId, req.getOldPassword(), req.getNewPassword()));
    }
}
