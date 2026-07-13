package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.mapper.RecycleBinMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 回收站：跨内容类型统一的「查看已删除 / 恢复 / 彻底删除」。
 *
 * <p>软删除本身由各内容 Service 的 delete 完成（MyBatis-Plus 全局逻辑删除，仅允许下架/草稿态内容删除，
 * 因此进入回收站的内容对小程序端已不可见）；本服务只做回收站侧操作。
 *
 * <p>彻底删除前会校验业务引用（报名 / 收藏 / 点赞 / 下载 / 学习进度）：有引用则拦截，
 * 引导管理员将其保留在回收站，以维护历史统计完整性；无引用时物理删除并级联清理所属子表。
 */
@Service
@RequiredArgsConstructor
public class RecycleBinService {

    private final RecycleBinMapper recycleBinMapper;
    private final AdminPermissionService adminPermissionService;

    /** 每种内容类型的表结构元信息与所属子表配置。 */
    private enum ContentType {
        news("news", "title", "新闻", List.<String[]>of()),
        hall("hall", "name", "展馆", List.<String[]>of(child("hall_section", "hall_id"), child("hall_media", "hall_id"))),
        craft("craft", "name", "文创", List.<String[]>of(child("craft_image", "craft_id"), child("craft_contact", "craft_id"))),
        course("course", "name", "课程", List.<String[]>of(child("course_resource", "course_id"))),
        resource("resource", "name", "资源", List.<String[]>of(child("course_resource", "resource_id"))),
        activity("activity", "title", "活动", List.<String[]>of());

        final String table;
        final String nameCol;
        final String label;
        final List<String[]> children;

        ContentType(String table, String nameCol, String label, List<String[]> children) {
            this.table = table;
            this.nameCol = nameCol;
            this.label = label;
            this.children = children;
        }

        static String[] child(String table, String fkCol) {
            return new String[]{table, fkCol};
        }

        static ContentType of(String key) {
            if (key == null) {
                throw new BusinessException(400, "缺少内容类型");
            }
            try {
                return valueOf(key.trim());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(400, "不支持的内容类型：" + key);
            }
        }
    }

    /** 各类型回收站计数概览（用于顶部筛选标签角标）。 */
    public List<Map<String, Object>> summary() {
        adminPermissionService.require("admin:super");
        List<Map<String, Object>> list = new ArrayList<>();
        for (ContentType t : ContentType.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type", t.name());
            m.put("label", t.label);
            m.put("count", recycleBinMapper.countDeleted(t.table));
            list.add(m);
        }
        return list;
    }

    /** 某类型的已删除项列表。 */
    public List<Map<String, Object>> list(String type) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);
        List<Map<String, Object>> rows = recycleBinMapper.listDeleted(t.table, t.nameCol);
        for (Map<String, Object> row : rows) {
            row.put("type", t.name());
            row.put("typeLabel", t.label);
        }
        return rows;
    }

    /** 恢复：is_deleted 置 0。恢复后内容仍为下架/草稿态，需管理员另行上架。 */
    @Transactional
    public void restore(String type, Long id) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);
        int n = recycleBinMapper.restore(t.table, id);
        if (n == 0) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }
    }

    /** 彻底删除：先校验业务引用，无引用时物理删除并级联清理子表。 */
    @Transactional
    public void purge(String type, Long id) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);

        String name = recycleBinMapper.findDeletedName(t.table, t.nameCol, id);
        if (name == null) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }

        List<String> blockers = collectReferenceBlockers(t, id);
        if (!blockers.isEmpty()) {
            throw new BusinessException(400,
                    "「" + name + "」仍存在 " + String.join("、", blockers)
                            + "，为保证统计完整性无法彻底删除，请保留在回收站。");
        }

        for (String[] child : t.children) {
            recycleBinMapper.purgeChildren(child[0], child[1], id);
        }
        int n = recycleBinMapper.purge(t.table, id);
        if (n == 0) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }
    }

    /** 汇总阻断彻底删除的引用（人性化描述）。 */
    private List<String> collectReferenceBlockers(ContentType t, Long id) {
        List<String> blockers = new ArrayList<>();
        long favorite = recycleBinMapper.countFavorite(t.name(), id);
        if (favorite > 0) {
            blockers.add(favorite + " 条收藏");
        }
        long like = recycleBinMapper.countLike(t.name(), id);
        if (like > 0) {
            blockers.add(like + " 条点赞");
        }
        switch (t) {
            case activity -> {
                long enroll = recycleBinMapper.countEnroll(id);
                if (enroll > 0) {
                    blockers.add(enroll + " 条报名记录");
                }
            }
            case resource -> {
                long download = recycleBinMapper.countDownload(id);
                if (download > 0) {
                    blockers.add(download + " 条下载记录");
                }
            }
            case course -> {
                long progress = recycleBinMapper.countCourseProgress(id);
                if (progress > 0) {
                    blockers.add(progress + " 条学习记录");
                }
            }
            default -> {
                // news / hall / craft 无额外业务引用
            }
        }
        return blockers;
    }
}
