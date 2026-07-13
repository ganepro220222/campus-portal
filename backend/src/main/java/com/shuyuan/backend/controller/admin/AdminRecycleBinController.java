package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.RecycleBinService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "回收站")
@RestController
@RequestMapping("/api/v1/admin/recycle-bin")
@RequiredArgsConstructor
public class AdminRecycleBinController {

    private final RecycleBinService recycleBinService;

    /** 各类型已删除数量概览 */
    @GetMapping("/summary")
    public Result<List<Map<String, Object>>> summary() {
        return Result.ok(recycleBinService.summary());
    }

    /** 某类型已删除项列表 */
    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam String type) {
        return Result.ok(recycleBinService.list(type));
    }

    /** 恢复 */
    @PutMapping("/{type}/{id}/restore")
    public Result<Void> restore(@PathVariable String type, @PathVariable Long id) {
        recycleBinService.restore(type, id);
        return Result.ok();
    }

    /** 彻底删除（有业务引用则拦截） */
    @DeleteMapping("/{type}/{id}")
    public Result<Void> purge(@PathVariable String type, @PathVariable Long id) {
        recycleBinService.purge(type, id);
        return Result.ok();
    }
}
