package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.MemberCreateRequest;
import com.shuyuan.backend.dto.PurgeRequest;
import com.shuyuan.backend.service.AdminMemberService;
import com.shuyuan.backend.vo.MemberImportErrorRow;
import com.shuyuan.backend.vo.MemberImportResult;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Tag(name = "师生账号")
@RestController
@RequestMapping("/api/v1/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminMemberService.list(keyword, status, page, size));
    }

    /** 单个新增：只有一两个人要建号时，不必走「下载模板→填→上传」一整圈 */
    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody MemberCreateRequest req) {
        return Result.ok(adminMemberService.create(req));
    }

    @GetMapping("/import-template")
    public void importTemplate(HttpServletResponse response) throws IOException {
        adminMemberService.writeImportTemplate(response);
    }

    @PostMapping("/import")
    public Result<MemberImportResult> importExcel(@RequestParam("file") MultipartFile file) {
        return Result.ok(adminMemberService.importExcel(file));
    }

    @PostMapping("/import-errors/export")
    public void exportImportErrors(@RequestBody List<MemberImportErrorRow> rows, HttpServletResponse response)
            throws IOException {
        adminMemberService.writeImportErrorReport(rows, response);
    }

    @PutMapping("/{id}/status")
    public Result<Map<String, Object>> updateStatus(@PathVariable Long id, @RequestParam int status) {
        return Result.ok(adminMemberService.updateStatus(id, status));
    }

    /** 清退：脱敏并禁用账号，保留历史统计外键，不物理删除 */
    @PutMapping("/{id}/anonymize")
    public Result<Map<String, Object>> anonymize(@PathVariable Long id) {
        return Result.ok(adminMemberService.anonymize(id));
    }

    /** 删除前的影响预览：留下过什么、能不能真删、还是只能清退 */
    @GetMapping("/{id}/delete-impact")
    public Result<Map<String, Object>> deleteImpact(@PathVariable Long id) {
        return Result.ok(adminMemberService.deleteImpact(id));
    }

    /**
     * 物理删除：仅限没留下任何业务记录的账号（导错的、测试的、演示的）。
     *
     * <p>密码走请求体，不进查询串——那会落进 Nginx access log 和浏览器历史。
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id,
                               @RequestBody(required = false) PurgeRequest body) {
        adminMemberService.delete(id, body != null ? body.getPassword() : null);
        return Result.ok();
    }
}
