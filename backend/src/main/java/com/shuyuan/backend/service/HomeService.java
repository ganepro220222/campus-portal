package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.*;
import com.shuyuan.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final HomeRecommendMapper homeRecommendMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CourseMapper courseMapper;
    private final CategoryService categoryService;

    public Map<String, Object> recommends() {
        List<HomeRecommend> items = homeRecommendMapper.selectList(new LambdaQueryWrapper<HomeRecommend>()
                .eq(HomeRecommend::getStatus, 1)
                .orderByAsc(HomeRecommend::getSort));

        Map<Long, String> newsCat = categoryService.nameMap("news");
        Map<Long, String> hallCat = categoryService.nameMap("hall");
        Map<Long, String> courseCat = categoryService.nameMap("course");

        List<Map<String, Object>> news = new ArrayList<>();
        List<Map<String, Object>> halls = new ArrayList<>();
        List<Map<String, Object>> courses = new ArrayList<>();

        for (HomeRecommend item : items) {
            String type = item.getModuleType();
            if ("news".equals(type)) {
                News n = newsMapper.selectById(item.getTargetId());
                if (n != null && "published".equals(n.getStatus())) {
                    news.add(toNewsItem(n, newsCat));
                }
            } else if ("hall".equals(type)) {
                Hall h = hallMapper.selectById(item.getTargetId());
                if (h != null && h.getStatus() != null && h.getStatus() == 1) {
                    halls.add(toHallItem(h, hallCat));
                }
            } else if ("course".equals(type)) {
                Course c = courseMapper.selectById(item.getTargetId());
                if (c != null && c.getStatus() != null && c.getStatus() == 1) {
                    courses.add(toCourseItem(c, courseCat));
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("news", news);
        result.put("halls", halls);
        result.put("courses", courses);
        return result;
    }

    private Map<String, Object> toNewsItem(News n, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("cover", n.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(n.getCoverFitMode()));
        m.put("categoryName", categoryService.getName(n.getCategoryId(), catMap));
        m.put("publishTime", n.getPublishTime());
        return m;
    }

    private Map<String, Object> toHallItem(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("shortName", HallService.resolveShortName(h));
        m.put("intro", h.getIntro());
        m.put("cover", h.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(h.getCoverFitMode()));
        m.put("categoryName", categoryService.getName(h.getCategoryId(), catMap));
        return m;
    }

    private Map<String, Object> toCourseItem(Course c, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", c.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(c.getCoverFitMode()));
        m.put("categoryName", categoryService.getName(c.getCategoryId(), catMap));
        m.put("lessonCount", c.getDurationMinutes() != null ? Math.max(1, c.getDurationMinutes() / 45) : 0);
        m.put("audience", c.getTargetAudience());
        return m;
    }
}
