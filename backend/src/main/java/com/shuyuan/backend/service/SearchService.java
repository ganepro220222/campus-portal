package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
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

    private final SearchIndexMapper searchIndexMapper;

    /**
     * 跨模块搜索（LIKE 兜底，与 docs 一致）
     */
    public PageResult<Map<String, Object>> search(String keyword, String types, int page, int size) {
        if (keyword == null || keyword.isBlank()) {
            return new PageResult<>(List.of(), 0, page, size);
        }
        String q = keyword.trim();
        List<String> typeList = parseTypes(types);

        LambdaQueryWrapper<SearchIndex> qw = new LambdaQueryWrapper<SearchIndex>()
                .eq(SearchIndex::getStatus, 1)
                .and(w -> w.like(SearchIndex::getTitle, q)
                        .or().like(SearchIndex::getSummary, q)
                        .or().like(SearchIndex::getKeywords, q));
        if (!typeList.isEmpty()) {
            qw.in(SearchIndex::getTargetType, typeList);
        }
        qw.orderByDesc(SearchIndex::getPublishTime);

        Page<SearchIndex> p = searchIndexMapper.selectPage(new Page<>(page, size), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
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
