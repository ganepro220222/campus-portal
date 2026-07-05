package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsMapper newsMapper;
    private final CategoryService categoryService;
    private final EventLogService eventLogService;

    public Object list(String category, Long categoryId, Integer page, Integer size) {
        Map<Long, String> catMap = categoryService.nameMap("news");
        LambdaQueryWrapper<News> qw = baseQuery(catMap, category, categoryId);

        if (page != null && page > 0) {
            int pageSize = size == null || size <= 0 ? 10 : size;
            Page<News> p = newsMapper.selectPage(new Page<>(page, pageSize), qw);
            List<Map<String, Object>> records = p.getRecords().stream()
                    .map(n -> toListItem(n, catMap))
                    .toList();
            return new PageResult<>(records, p.getTotal(), page, pageSize);
        }

        List<News> list = newsMapper.selectList(qw);
        return list.stream().map(n -> toListItem(n, catMap)).toList();
    }

    public Map<String, Object> detail(Long id) {
        News news = newsMapper.selectById(id);
        if (news == null || !"published".equals(news.getStatus())) {
            throw new BusinessException(404, "资讯不存在");
        }
        news.setViewCount(news.getViewCount() + 1);
        newsMapper.updateById(news);
        eventLogService.record("view", "news", id);

        Map<Long, String> catMap = categoryService.nameMap("news");
        String categoryName = categoryService.getName(news.getCategoryId(), catMap);
        List<String> paras = FormatUtils.splitParagraphs(news.getContent());
        String lead = news.getSummary() != null ? news.getSummary()
                : (paras.isEmpty() ? "" : paras.get(0));

        Map<String, Object> m = new HashMap<>();
        m.put("id", news.getId());
        m.put("title", news.getTitle());
        m.put("cover", news.getCover());
        m.put("category", categoryName);
        m.put("categoryName", categoryName);
        m.put("publishTime", news.getPublishTime());
        m.put("date", FormatUtils.formatDate(news.getPublishTime()));
        m.put("viewCount", news.getViewCount());
        m.put("read", FormatUtils.formatCount(news.getViewCount()));
        m.put("readCount", news.getViewCount());
        m.put("summary", news.getSummary());
        m.put("lead", lead);
        m.put("drop", FormatUtils.firstChar(lead));
        m.put("paras", paras);
        m.put("content", news.getContent());
        return m;
    }

    public List<Map<String, Object>> related(Long id) {
        News news = newsMapper.selectById(id);
        if (news == null) {
            return List.of();
        }
        Map<Long, String> catMap = categoryService.nameMap("news");
        List<News> list = newsMapper.selectList(new LambdaQueryWrapper<News>()
                .eq(News::getStatus, "published")
                .eq(news.getCategoryId() != null, News::getCategoryId, news.getCategoryId())
                .ne(News::getId, id)
                .orderByDesc(News::getPublishTime)
                .last("LIMIT 5"));
        return list.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("n", n.getTitle());
            m.put("title", n.getTitle());
            String cat = categoryService.getName(n.getCategoryId(), catMap);
            m.put("m", cat + " · " + FormatUtils.formatDate(n.getPublishTime()));
            return m;
        }).toList();
    }

    private LambdaQueryWrapper<News> baseQuery(Map<Long, String> catMap, String category, Long categoryId) {
        LambdaQueryWrapper<News> qw = new LambdaQueryWrapper<News>()
                .eq(News::getStatus, "published")
                .orderByDesc(News::getIsTop)
                .orderByDesc(News::getPublishTime);
        if (categoryId != null && categoryId > 0) {
            qw.eq(News::getCategoryId, categoryId);
        } else if (category != null && !category.isBlank() && !"全部".equals(category)) {
            Long cid = categoryService.findIdByName("news", category);
            if (cid != null) {
                qw.eq(News::getCategoryId, cid);
            }
        }
        return qw;
    }

    private Map<String, Object> toListItem(News n, Map<Long, String> catMap) {
        String categoryName = categoryService.getName(n.getCategoryId(), catMap);
        Map<String, Object> m = new HashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("cover", n.getCover());
        m.put("category", categoryName);
        m.put("categoryName", categoryName);
        m.put("publishTime", FormatUtils.formatDate(n.getPublishTime()));
        m.put("readCount", n.getViewCount());
        return m;
    }
}
