package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.HallSaveRequest;
import com.shuyuan.backend.service.AdminHallService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/halls")
@RequiredArgsConstructor
public class AdminHallController {

    private final AdminHallService adminHallService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminHallService.list(page, size));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody HallSaveRequest req) {
        return Result.ok(adminHallService.create(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody HallSaveRequest req) {
        return Result.ok(adminHallService.update(id, req));
    }
}
