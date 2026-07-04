package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.ProfileService;
import com.shuyuan.backend.vo.MemberVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public Result<MemberVO> profile() {
        return Result.ok(profileService.profile());
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return Result.ok(profileService.stats());
    }

    @GetMapping("/enrolls")
    public Result<java.util.List<Map<String, Object>>> enrolls() {
        return Result.ok(profileService.enrolls());
    }
}
