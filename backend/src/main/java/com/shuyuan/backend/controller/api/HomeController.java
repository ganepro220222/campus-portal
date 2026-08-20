package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.HomeService;
import com.shuyuan.backend.service.NavItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "首页")
@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;
    private final NavItemService navItemService;

    @GetMapping("/recommends")
    public Result<Map<String, Object>> recommends() {
        return Result.ok(homeService.recommends());
    }

    @GetMapping("/nav-items")
    public Result<List<Map<String, Object>>> navItems() {
        return Result.ok(navItemService.listPublished());
    }
}
