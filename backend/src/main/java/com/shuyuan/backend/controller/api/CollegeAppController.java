package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.CollegeAppService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "学院矩阵")
@RestController
@RequestMapping("/api/v1/colleges")
@RequiredArgsConstructor
public class CollegeAppController {

    private final CollegeAppService collegeAppService;

    @GetMapping
    public Result<List<Map<String, Object>>> list() {
        return Result.ok(collegeAppService.listActive());
    }
}
