package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.PurgeRequest;
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

    /** 彻底删除前的影响预览：连着什么、属于哪一档、要不要输密码 */
    @GetMapping("/{type}/{id}/impact")
    public Result<Map<String, Object>> impact(@PathVariable String type, @PathVariable Long id) {
        return Result.ok(recycleBinService.impact(type, id));
    }

    /**
     * 彻底删除。
     *
     * <p>密码走请求体而不是查询参数：查询串会进 Nginx access log 和浏览器历史。
     * 无引用的低危项不带 body 也能删。
     */
    @DeleteMapping("/{type}/{id}")
    public Result<Void> purge(@PathVariable String type,
                              @PathVariable Long id,
                              @RequestBody(required = false) PurgeRequest body) {
        recycleBinService.purge(type, id, body != null ? body.getPassword() : null);
        return Result.ok();
    }
}
