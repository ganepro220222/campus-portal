package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HomeRecommendSaveRequest;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.HomeRecommend;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.HomeRecommendMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import com.shuyuan.backend.util.HomeRecommendModules;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminHomeRecommendService {

    private final HomeRecommendMapper homeRecommendMapper;
    private final NewsMapper newsMapper;
    private final HallMapper hallMapper;
    private final CourseMapper courseMapper;
    private final AdminPermissionService adminPermissionService;

    /**
     * 按小程序首页顺序返回三块：展馆、动态、课程。
     * 内容下架或删除后推荐位仍保留，由 targetMissing / targetPublished 标明首页是否还能展示。
     */
    public Map<String, Object> listGrouped() {
        adminPermissionService.require("admin:super");
        List<HomeRecommend> items = homeRecommendMapper.selectList(new LambdaQueryWrapper<HomeRecommend>()
                .orderByAsc(HomeRecommend::getSort)
                .orderByAsc(HomeRecommend::getId));

        List<Map<String, Object>> halls = new ArrayList<>();
        List<Map<String, Object>> news = new ArrayList<>();
        List<Map<String, Object>> courses = new ArrayList<>();
        for (HomeRecommend item : items) {
            String type = item.getModuleType();
            Map<String, Object> vo = toVo(item);
            if (HomeRecommendModules.HALL.equals(type)) {
                halls.add(vo);
            } else if (HomeRecommendModules.NEWS.equals(type)) {
                news.add(vo);
            } else if (HomeRecommendModules.COURSE.equals(type)) {
                courses.add(vo);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("halls", halls);
        result.put("news", news);
        result.put("courses", courses);
        return result;
    }

    public Map<String, Object> create(HomeRecommendSaveRequest req) {
        adminPermissionService.require("admin:super");
        String moduleType = normalizeModuleType(req != null ? req.getModuleType() : null);
        Long targetId = requireTargetId(req);
        assertTargetOnline(moduleType, targetId);
        assertNotDuplicate(moduleType, targetId);

        HomeRecommend row = new HomeRecommend();
        row.setModuleType(moduleType);
        row.setTargetId(targetId);
        row.setSort(normalizeSort(req.getSort()));
        row.setStatus(normalizeStatus(req.getStatus(), 1));
        homeRecommendMapper.insert(row);
        return toVo(homeRecommendMapper.selectById(row.getId()));
    }

    public Map<String, Object> update(Long id, HomeRecommendSaveRequest req) {
        adminPermissionService.require("admin:super");
        HomeRecommend existing = requireRow(id);
        if (req == null) {
            throw new BusinessException(400, "请填写推荐位信息");
        }
        // 板块和内容一经选定不再改，避免和去重、已下架内容搅在一起；要换内容就移除后重加
        if (req.getSort() != null) {
            existing.setSort(normalizeSort(req.getSort()));
        }
        if (req.getStatus() != null) {
            existing.setStatus(normalizeStatus(req.getStatus(), existing.getStatus()));
        }
        homeRecommendMapper.updateById(existing);
        return toVo(homeRecommendMapper.selectById(id));
    }

    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        requireRow(id);
        homeRecommendMapper.deleteById(id);
    }

    private HomeRecommend requireRow(Long id) {
        HomeRecommend row = homeRecommendMapper.selectById(id);
        if (row == null) {
            throw new BusinessException(404, "推荐位不存在");
        }
        return row;
    }

    private static String normalizeModuleType(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new BusinessException(400, "请选择板块");
        }
        String type = raw.trim();
        if (!HomeRecommendModules.isKnown(type)) {
            throw new BusinessException(400, "板块只能是动态、展馆或课程");
        }
        return type;
    }

    private static Long requireTargetId(HomeRecommendSaveRequest req) {
        if (req == null || req.getTargetId() == null || req.getTargetId() <= 0) {
            throw new BusinessException(400, "请选择内容");
        }
        return req.getTargetId();
    }

    private static int normalizeSort(Integer sort) {
        if (sort == null) {
            return 0;
        }
        if (sort < 0 || sort > 999) {
            throw new BusinessException(400, "排序须在 0 到 999 之间");
        }
        return sort;
    }

    private static int normalizeStatus(Integer status, int fallback) {
        if (status == null) {
            return fallback;
        }
        if (status != 0 && status != 1) {
            throw new BusinessException(400, "状态只能是上架或下架");
        }
        return status;
    }

    private void assertNotDuplicate(String moduleType, Long targetId) {
        Long count = homeRecommendMapper.selectCount(new LambdaQueryWrapper<HomeRecommend>()
                .eq(HomeRecommend::getModuleType, moduleType)
                .eq(HomeRecommend::getTargetId, targetId));
        if (count != null && count > 0) {
            throw new BusinessException(400, "该内容已在首页推荐中");
        }
    }

    private void assertTargetOnline(String moduleType, Long targetId) {
        TargetRef ref = resolveTarget(moduleType, targetId);
        if (ref.missing()) {
            throw new BusinessException(400, HomeRecommendModules.contentLabel(moduleType) + "不存在或已删除");
        }
        if (!ref.published()) {
            throw new BusinessException(400, "请选择已发布或已上架的" + HomeRecommendModules.contentLabel(moduleType));
        }
    }

    private Map<String, Object> toVo(HomeRecommend item) {
        TargetRef ref = resolveTarget(item.getModuleType(), item.getTargetId());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", item.getId());
        m.put("moduleType", item.getModuleType());
        m.put("targetId", item.getTargetId());
        m.put("title", ref.title());
        m.put("targetMissing", ref.missing());
        m.put("targetPublished", ref.published());
        m.put("sort", item.getSort());
        m.put("status", item.getStatus());
        return m;
    }

    private TargetRef resolveTarget(String moduleType, Long targetId) {
        if (targetId == null) {
            return TargetRef.notFound();
        }
        if (HomeRecommendModules.NEWS.equals(moduleType)) {
            News news = newsMapper.selectById(targetId);
            if (news == null) {
                return TargetRef.notFound();
            }
            String title = news.getTitle() != null ? news.getTitle() : "";
            return new TargetRef(title, "published".equals(news.getStatus()), false);
        }
        if (HomeRecommendModules.HALL.equals(moduleType)) {
            Hall hall = hallMapper.selectById(targetId);
            if (hall == null) {
                return TargetRef.notFound();
            }
            String title = hall.getName() != null ? hall.getName() : "";
            return new TargetRef(title, hall.getStatus() != null && hall.getStatus() == 1, false);
        }
        if (HomeRecommendModules.COURSE.equals(moduleType)) {
            Course course = courseMapper.selectById(targetId);
            if (course == null) {
                return TargetRef.notFound();
            }
            String title = course.getName() != null ? course.getName() : "";
            return new TargetRef(title, course.getStatus() != null && course.getStatus() == 1, false);
        }
        return TargetRef.notFound();
    }

    private record TargetRef(String title, boolean published, boolean missing) {
        static TargetRef notFound() {
            return new TargetRef("", false, true);
        }
    }
}
