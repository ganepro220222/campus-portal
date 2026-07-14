package com.shuyuan.backend.controller.admin;

import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.dto.KnowledgeDocSaveRequest;
import com.shuyuan.backend.service.KnowledgeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "AI 知识库")
@RestController
@RequestMapping("/api/v1/admin/knowledge/docs")
@RequiredArgsConstructor
public class AdminKnowledgeController {

    private final KnowledgeService knowledgeService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(knowledgeService.listDocs(page, size));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@Valid @RequestBody KnowledgeDocSaveRequest req) {
        return Result.ok(knowledgeService.ingestTextDoc(req));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id,
                                              @Valid @RequestBody KnowledgeDocSaveRequest req) {
        return Result.ok(knowledgeService.updateTextDoc(id, req));
    }

    /** 编辑回填：标题 + 原始正文 */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(knowledgeService.docDetail(id));
    }

    @GetMapping("/{id}/status")
    public Result<Map<String, Object>> status(@PathVariable Long id) {
        return Result.ok(knowledgeService.docStatus(id));
    }

    /** 启用 / 停用（停用后不参与 AI 检索，保留文档可随时启用） */
    @PutMapping("/{id}/enabled")
    public Result<Map<String, Object>> setEnabled(@PathVariable Long id, @RequestParam boolean enabled) {
        return Result.ok(knowledgeService.setEnabled(id, enabled));
    }

    /** 查看分段 */
    @GetMapping("/{id}/chunks")
    public Result<List<Map<String, Object>>> chunks(@PathVariable Long id) {
        return Result.ok(knowledgeService.listChunks(id));
    }

    /** 检索自测「试问」 */
    @GetMapping("/retrieve-test")
    public Result<List<Map<String, Object>>> retrieveTest(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int topK) {
        return Result.ok(knowledgeService.testRetrieve(q, topK));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        knowledgeService.deleteDoc(id);
        return Result.ok();
    }
}
