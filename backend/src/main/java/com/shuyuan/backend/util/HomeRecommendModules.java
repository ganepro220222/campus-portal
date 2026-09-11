package com.shuyuan.backend.util;

import java.util.Set;

/** 首页推荐位板块：与小程序首页三块、home_recommend.module_type 一致 */
public final class HomeRecommendModules {

    public static final String NEWS = "news";
    public static final String HALL = "hall";
    public static final String COURSE = "course";

    private static final Set<String> ALL = Set.of(NEWS, HALL, COURSE);

    private HomeRecommendModules() {
    }

    public static boolean isKnown(String moduleType) {
        return moduleType != null && ALL.contains(moduleType);
    }

    public static String contentLabel(String moduleType) {
        if (NEWS.equals(moduleType)) {
            return "动态";
        }
        if (HALL.equals(moduleType)) {
            return "展馆";
        }
        if (COURSE.equals(moduleType)) {
            return "课程";
        }
        return "内容";
    }
}
