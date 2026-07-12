package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Activity;
import com.shuyuan.backend.entity.Course;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.entity.News;
import com.shuyuan.backend.mapper.ActivityMapper;
import com.shuyuan.backend.mapper.CourseMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import com.shuyuan.backend.mapper.HallMapper;
import com.shuyuan.backend.mapper.NewsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Banner 跳转配置：运营侧选「内容类型 + 目标」，不手填小程序路径。
 */
@Component
@RequiredArgsConstructor
public class BannerLinkPolicy {

    public static final String TYPE_NONE = "none";
    public static final String TYPE_URL = "url";
    /** 兼容旧数据：手填内部路径 */
    public static final String TYPE_PAGE = "page";
    public static final String TYPE_FIXED = "fixed";
    public static final String TYPE_NEWS = "news";
    public static final String TYPE_COURSE = "course";
    public static final String TYPE_HALL = "hall";
    public static final String TYPE_ACTIVITY = "activity";
    public static final String TYPE_CRAFT = "craft";

    private static final Set<String> CONTENT_TYPES = Set.of(
            TYPE_NEWS, TYPE_COURSE, TYPE_HALL, TYPE_ACTIVITY, TYPE_CRAFT);

    private static final Map<String, String> FIXED_LABELS = Map.of(
            "home", "首页",
            "news", "新闻频道",
            "hall", "展馆频道",
            "course", "课程频道",
            "activity", "活动报名");

    private static final Map<String, String> TYPE_LABELS = Map.of(
            TYPE_NONE, "无跳转",
            TYPE_URL, "外部网页",
            TYPE_PAGE, "自定义页面（旧）",
            TYPE_FIXED, "频道页面",
            TYPE_NEWS, "新闻详情",
            TYPE_COURSE, "课程详情",
            TYPE_HALL, "展馆详情",
            TYPE_ACTIVITY, "活动详情",
            TYPE_CRAFT, "文创详情");

    private final NewsMapper newsMapper;
    private final CourseMapper courseMapper;
    private final HallMapper hallMapper;
    private final ActivityMapper activityMapper;
    private final CraftMapper craftMapper;

    public void validate(String linkType, String linkValue) {
        String type = normalizeType(linkType);
        String value = trim(linkValue);
        if (TYPE_NONE.equals(type)) {
            return;
        }
        if (TYPE_URL.equals(type)) {
            if (value == null || value.isBlank()) {
                throw new BusinessException(400, "请填写外部链接地址");
            }
            if (!value.startsWith("http://") && !value.startsWith("https://")) {
                throw new BusinessException(400, "外部链接须以 http:// 或 https:// 开头");
            }
            return;
        }
        if (TYPE_PAGE.equals(type)) {
            if (value == null || value.isBlank()) {
                throw new BusinessException(400, "请填写小程序页面路径");
            }
            return;
        }
        if (TYPE_FIXED.equals(type)) {
            if (value == null || !FIXED_LABELS.containsKey(value)) {
                throw new BusinessException(400, "请选择频道页面");
            }
            return;
        }
        if (CONTENT_TYPES.contains(type)) {
            Long id = parseContentId(value);
            requirePublishedContent(type, id);
            return;
        }
        throw new BusinessException(400, "不支持的跳转类型");
    }

    public String resolveLabel(String linkType, String linkValue) {
        String type = normalizeType(linkType);
        String value = trim(linkValue);
        if (TYPE_NONE.equals(type)) {
            return TYPE_LABELS.get(TYPE_NONE);
        }
        if (TYPE_URL.equals(type)) {
            return value == null || value.isBlank() ? "外部网页" : "外链：" + abbreviate(value, 40);
        }
        if (TYPE_PAGE.equals(type)) {
            return value == null || value.isBlank() ? "自定义页面" : abbreviate(value, 48);
        }
        if (TYPE_FIXED.equals(type)) {
            return FIXED_LABELS.getOrDefault(value, "频道页面");
        }
        if (CONTENT_TYPES.contains(type)) {
            try {
                Long id = parseContentId(value);
                String title = loadContentTitle(type, id);
                return TYPE_LABELS.getOrDefault(type, type) + "：" + title;
            } catch (BusinessException e) {
                return TYPE_LABELS.getOrDefault(type, type) + "（#" + value + "）";
            }
        }
        return type;
    }

    public Map<String, String> fixedPageOptions() {
        return new LinkedHashMap<>(FIXED_LABELS);
    }

    private void requirePublishedContent(String type, Long id) {
        switch (type) {
            case TYPE_NEWS -> {
                News news = newsMapper.selectById(id);
                if (news == null || !"published".equals(news.getStatus())) {
                    throw new BusinessException(400, "请选择已发布的新闻");
                }
            }
            case TYPE_COURSE -> {
                Course course = courseMapper.selectById(id);
                if (course == null || course.getStatus() == null || course.getStatus() != 1) {
                    throw new BusinessException(400, "请选择已上架的课程");
                }
            }
            case TYPE_HALL -> {
                Hall hall = hallMapper.selectById(id);
                if (hall == null || hall.getStatus() == null || hall.getStatus() != 1) {
                    throw new BusinessException(400, "请选择已上架的展馆");
                }
            }
            case TYPE_ACTIVITY -> {
                Activity activity = activityMapper.selectById(id);
                if (activity == null || !"published".equals(activity.getStatus())) {
                    throw new BusinessException(400, "请选择已发布的活动");
                }
            }
            case TYPE_CRAFT -> {
                Craft craft = craftMapper.selectById(id);
                if (craft == null || craft.getStatus() == null || craft.getStatus() != 1) {
                    throw new BusinessException(400, "请选择已上架的文创");
                }
            }
            default -> throw new BusinessException(400, "不支持的跳转类型");
        }
    }

    private String loadContentTitle(String type, Long id) {
        requirePublishedContent(type, id);
        return switch (type) {
            case TYPE_NEWS -> newsMapper.selectById(id).getTitle();
            case TYPE_COURSE -> courseMapper.selectById(id).getName();
            case TYPE_HALL -> hallMapper.selectById(id).getName();
            case TYPE_ACTIVITY -> activityMapper.selectById(id).getTitle();
            case TYPE_CRAFT -> craftMapper.selectById(id).getName();
            default -> String.valueOf(id);
        };
    }

    private static Long parseContentId(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(400, "请选择跳转内容");
        }
        try {
            long id = Long.parseLong(value.trim());
            if (id <= 0) {
                throw new BusinessException(400, "内容 ID 无效");
            }
            return id;
        } catch (NumberFormatException e) {
            throw new BusinessException(400, "内容 ID 无效");
        }
    }

    private static String normalizeType(String linkType) {
        if (linkType == null || linkType.isBlank()) {
            return TYPE_NONE;
        }
        return linkType.trim();
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private static String abbreviate(String s, int max) {
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max - 1) + "…";
    }
}
