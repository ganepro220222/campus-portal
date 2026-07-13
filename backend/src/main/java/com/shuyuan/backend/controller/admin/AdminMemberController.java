package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
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
}
