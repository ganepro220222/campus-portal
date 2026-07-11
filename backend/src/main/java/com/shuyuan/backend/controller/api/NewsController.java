package com.shuyuan.backend.controller.api;

import com.shuyuan.backend.common.Result;
import com.shuyuan.backend.service.NewsInteractionService;
import com.shuyuan.backend.service.NewsService;
import com.shuyuan.backend.util.HttpRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "新闻资讯")
@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;
    private final NewsInteractionService newsInteractionService;

    @GetMapping
    public Result<Object> list(@RequestParam(required = false) String category,
                               @RequestParam(required = false) Long categoryId,
                               @RequestParam(required = false) Integer page,
                               @RequestParam(required = false) Integer size) {
        return Result.ok(newsService.list(category, categoryId, page, size));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok(newsService.detail(id, HttpRequestUtils.resolveClientIp(request)));
    }

    @GetMapping("/{id}/related")
    public Result<List<Map<String, Object>>> related(@PathVariable Long id) {
        return Result.ok(newsService.related(id));
    }

    @PostMapping("/{id}/like")
    public Result<Map<String, Object>> like(@PathVariable Long id) {
        return Result.ok(newsInteractionService.toggleLike(id));
    }

    @PostMapping("/{id}/favorite")
    public Result<Map<String, Object>> favorite(@PathVariable Long id) {
        return Result.ok(newsInteractionService.toggleFavorite(id));
    }
}
