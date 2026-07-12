package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.SearchIndex;
import com.shuyuan.backend.mapper.SearchIndexMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    static final int MAX_PAGE_SIZE = 50;
    static final int MAX_KEYWORD_LENGTH = 100;

    private final SearchIndexMapper searchIndexMapper;

    /**
     * 跨模块搜索（LIKE 兜底，与 docs 一致）
     */
    public PageResult<Map<String, Object>> search(String keyword, String types, int page, int size) {
        if (keyword == null || keyword.isBlank()) {
            return new PageResult<>(List.of(), 0, normalizePage(page), normalizeSize(size));
        }
        String q = keyword.trim();
        if (q.length() > MAX_KEYWORD_LENGTH) {
            throw new BusinessException(400, "搜索关键词过长，请控制在" + MAX_KEYWORD_LENGTH + "字以内");
        }
        if (isWildcardOnly(q)) {
            int safePage = normalizePage(page);
            int safeSize = normalizeSize(size);
            return new PageResult<>(List.of(), 0, safePage, safeSize);
        }
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        List<String> typeList = parseTypes(types);
        String likePattern = toLikePattern(q);

        LambdaQueryWrapper<SearchIndex> qw = new LambdaQueryWrapper<SearchIndex>()
                .eq(SearchIndex::getStatus, 1)
                .and(w -> w.apply("title LIKE {0} ESCAPE '\\\\'", likePattern)
                        .or().apply("summary LIKE {0} ESCAPE '\\\\'", likePattern)
                        .or().apply("keywords LIKE {0} ESCAPE '\\\\'", likePattern));
        if (!typeList.isEmpty()) {
            qw.in(SearchIndex::getTargetType, typeList);
        }
        qw.orderByDesc(SearchIndex::getPublishTime);

        Page<SearchIndex> p = searchIndexMapper.selectPage(new Page<>(safePage, safeSize), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), safePage, safeSize);
    }

    int normalizePage(int page) {
        return page < 1 ? 1 : page;
    }

    int normalizeSize(int size) {
        if (size < 1) {
            return 10;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    /** 转义 LIKE 通配符，供 ESCAPE '\\' 使用 */
    static String toLikePattern(String keyword) {
        String escaped = escapeLike(keyword);
        return "%" + escaped + "%";
    }

    static boolean isWildcardOnly(String keyword) {
        for (int i = 0; i < keyword.length(); i++) {
            char c = keyword.charAt(i);
            if (c != '%' && c != '_' && !Character.isWhitespace(c)) {
                return false;
            }
        }
        return !keyword.isEmpty();
    }

    private static String escapeLike(String raw) {
        StringBuilder sb = new StringBuilder(raw.length() * 2);
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (c == '\\' || c == '%' || c == '_') {
                sb.append('\\');
            }
            sb.append(c);
        }
        return sb.toString();
    }

    private List<String> parseTypes(String types) {
        if (types == null || types.isBlank()) {
            return List.of();
        }
        return Arrays.stream(types.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private Map<String, Object> toVo(SearchIndex item) {
        Map<String, Object> m = new HashMap<>();
        m.put("targetType", item.getTargetType());
        m.put("targetId", item.getTargetId());
        m.put("title", item.getTitle());
        m.put("summary", item.getSummary());
        m.put("cover", item.getCover());
        m.put("publishTime", FormatUtils.formatDate(item.getPublishTime()));
        m.put("typeLabel", typeLabel(item.getTargetType()));
        return m;
    }

    private String typeLabel(String type) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case "news" -> "新闻";
            case "hall" -> "展馆";
            case "craft" -> "文创";
            case "course" -> "课程";
            case "resource" -> "资源";
            default -> type;
        };
    }
}
