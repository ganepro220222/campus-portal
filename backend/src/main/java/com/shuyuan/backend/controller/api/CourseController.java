package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.CourseProgressRequest;
import com.shuyuan.backend.service.CourseProgressService;
import com.shuyuan.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "课程中心")
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CourseProgressService courseProgressService;

    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam(required = false) String category) {
        return Result.ok(courseService.list(category));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(courseService.detail(id));
    }

    @GetMapping("/{id}/progress")
    public Result<Map<String, Object>> progress(@PathVariable Long id) {
        return Result.ok(courseProgressService.getProgress(id));
    }

    @PostMapping("/{id}/progress")
    public Result<Map<String, Object>> reportProgress(
            @PathVariable Long id,
            @Valid @RequestBody CourseProgressRequest req) {
        return Result.ok(courseProgressService.reportProgress(id, req));
    }
}
