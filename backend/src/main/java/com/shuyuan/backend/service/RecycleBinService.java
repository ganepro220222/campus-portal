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
 * <p>软删除本身由各内容 Service 的 delete 完成（MyBatis-Plus 全局逻辑删除），本服务只做回收站侧操作。
 *
 * <p>彻底删除按「影响面」分三档，而不是一刀切地拦住：
 * <ul>
 *   <li>{@code LOW} —— 没有任何引用。示例数据、导错的内容都在这一档，二次确认即可删。</li>
 *   <li>{@code HIGH} —— 有用户行为引用（收藏 / 点赞 / 报名 / 下载 / 学习进度）。
 *       明示将连带删除多少行，并要求重输管理员密码。明细删掉不影响历史统计：
 *       stat_daily / stat_content 存的是按日冻结的快照，往年的数不会因此改变。</li>
 *   <li>{@code BLOCKED} —— 有结构性依赖（分类下还挂着内容、角色下还挂着管理员）。
 *       这一档不是「永远不能删」，是「先把依赖迁走」——照着提示处理完就能删。</li>
 * </ul>
 *
 * <p>日志类不进回收站，但三张表性质不同，不能一概而论：
 * <ul>
 *   <li>{@code sys_log}（管理员操作审计）与 {@code subscribe_outbox}（通知投递记录）
 *       是证据——能挑着删的日志就不再是证据。只按 DataRetentionService 的保留期整批过期，
 *       任何业务删除都不碰它们。</li>
 *   <li>{@code event_log}（用户行为分析）同样不提供后台逐条删除，但删除某个师生账号时
 *       会连同其行为记录一并抹掉：那是在抹掉这个人本身，不是在销毁证据。
 *       且能被物理删除的账号按定义没有业务记录，聚合快照不受影响。</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class RecycleBinService {

    private final RecycleBinMapper recycleBinMapper;
    private final AdminPermissionService adminPermissionService;
    private final DangerousActionGuard dangerousActionGuard;
    private final AdminAnnouncementService adminAnnouncementService;
    private final OssMediaCleanupService ossMediaCleanupService;

    /** 彻底删除的风险档位 */
    public enum DeleteRisk {
        /** 无引用，二次确认即可 */
        LOW,
        /** 有用户行为引用，需重输管理员密码，删除时连带清理 */
        HIGH,
        /** 有结构性依赖，必须先迁走依赖 */
        BLOCKED
    }

    /** 一条影响项：给老师看的「会连带动到什么」 */
    private record Reference(String label, long count, boolean blocking, String hint) {
        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", label);
            m.put("count", count);
            m.put("blocking", blocking);
            m.put("hint", hint);
            return m;
        }
    }

    /**
     * 界面上的分组：13 个类型平铺一排读不过来，按来源分三组。
     *
     * <p>放在外层类而不是枚举内部——Java 不允许枚举常量的初始化引用本枚举的静态字段。
     */
    private static final String GROUP_CONTENT = "内容";
    private static final String GROUP_SETTING = "站点配置";
    private static final String GROUP_SYSTEM = "系统";

    /**
     * 恢复策略：不能对所有类型共用「只改 is_deleted」。
     *
     * <p>内容类删除前必须先下架/转草稿，恢复时保留原状态是安全的；
     * 站点配置类和管理员账号删除时不改 status，恢复时必须强制禁用。
     */
    private enum RestorePolicy {
        /** 仅清除 is_deleted（删除前已处于安全态） */
        KEEP,
        /** 恢复为 status=0，需手动启用 */
        FORCE_DISABLED,
        /** 管理员账号：禁用 + 递增 token_version */
        ADMIN_DISABLED
    }

    /** 每种内容类型的表结构元信息与所属子表配置。 */
    private enum ContentType {
        news("news", "title", "动态", GROUP_CONTENT, List.of(), true, RestorePolicy.KEEP),
        hall("hall", "name", "展馆", GROUP_CONTENT, List.<String[]>of(child("hall_section", "hall_id"), child("hall_media", "hall_id")), true, RestorePolicy.KEEP),
        craft("craft", "name", "文创", GROUP_CONTENT, List.<String[]>of(child("craft_image", "craft_id"), child("craft_contact", "craft_id")), true, RestorePolicy.KEEP),
        course("course", "name", "课程", GROUP_CONTENT, List.<String[]>of(child("course_resource", "course_id")), true, RestorePolicy.KEEP),
        resource("resource", "name", "资源", GROUP_CONTENT, List.<String[]>of(child("course_resource", "resource_id")), true, RestorePolicy.KEEP),
        activity("activity", "title", "活动", GROUP_CONTENT, List.of(), true, RestorePolicy.KEEP),
        announcement("announcement", "content", "公告", GROUP_SETTING, List.of(), false, RestorePolicy.FORCE_DISABLED),
        banner("banner", "title", "轮播图", GROUP_SETTING, List.of(), false, RestorePolicy.FORCE_DISABLED),
        category("category", "name", "分类", GROUP_SETTING, List.of(), false, RestorePolicy.FORCE_DISABLED),
        college_app("college_app", "name", "书院应用", GROUP_SETTING, List.of(), false, RestorePolicy.FORCE_DISABLED),
        nav_item("nav_item", "label", "导航项", GROUP_SETTING, List.of(), false, RestorePolicy.FORCE_DISABLED),
        sys_role("sys_role", "role_name", "管理角色", GROUP_SYSTEM, List.of(), false, RestorePolicy.KEEP),
        sys_user("sys_user", "username", "管理员账号", GROUP_SYSTEM, List.of(), false, RestorePolicy.ADMIN_DISABLED);

        final String table;
        final String nameCol;
        final String label;
        final String group;
        final List<String[]> children;
        /** 小程序端可收藏 / 点赞的内容类型；其余类型查 favorite / like 纯属白跑 */
        final boolean interactive;
        final RestorePolicy restorePolicy;

        ContentType(String table, String nameCol, String label, String group,
                    List<String[]> children, boolean interactive, RestorePolicy restorePolicy) {
            this.table = table;
            this.nameCol = nameCol;
            this.label = label;
            this.group = group;
            this.children = children;
            this.interactive = interactive;
            this.restorePolicy = restorePolicy;
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

    /** is_deleted 取值：查「在用」还是查「在回收站里」 */
    private static final int IN_USE = 0;
    private static final int IN_RECYCLE_BIN = 1;

    /** 引用了 category_id 的内容表；分类被彻底删除前必须先清空这些引用 */
    private static final List<String[]> CATEGORY_USERS = List.of(
            new String[]{"news", "动态"},
            new String[]{"hall", "展馆"},
            new String[]{"craft", "文创"},
            new String[]{"course", "课程"},
            new String[]{"resource", "资源"});

    /** 各类型回收站计数概览（用于顶部筛选标签角标）。 */
    public List<Map<String, Object>> summary() {
        adminPermissionService.require("admin:super");
        List<Map<String, Object>> list = new ArrayList<>();
        for (ContentType t : ContentType.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type", t.name());
            m.put("label", t.label);
            m.put("group", t.group);
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

    /**
     * 从回收站恢复。
     *
     * <p>内容类删除前须先下架/转草稿，恢复时保留原状态；站点配置与管理员账号恢复时强制禁用，
     * 避免「点恢复」后立即重新对外展示或恢复登录能力。
     */
    @Transactional
    public void restore(String type, Long id) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);
        int n = switch (t.restorePolicy) {
            case KEEP -> recycleBinMapper.restore(t.table, id);
            case FORCE_DISABLED -> recycleBinMapper.restoreDisabled(t.table, id);
            case ADMIN_DISABLED -> recycleBinMapper.restoreSysUserDisabled(id);
        };
        if (n == 0) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }
        if (t == ContentType.announcement) {
            adminAnnouncementService.evictActiveCache();
        }
    }

    /**
     * 彻底删除前的影响预览：这条记录连着什么、属于哪一档、能不能删。
     *
     * <p>前端据此决定确认框长什么样——低危只需点确认，高危要列清单并收密码，
     * 受阻则直接告诉老师先去做什么。
     */
    public Map<String, Object> impact(String type, Long id) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);
        String name = requireDeletedName(t, id);

        List<Reference> refs = collectReferences(t, id);
        DeleteRisk risk = resolveRisk(refs);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", t.name());
        m.put("typeLabel", t.label);
        m.put("id", id);
        m.put("name", name);
        m.put("risk", risk.name());
        m.put("requiresPassword", risk == DeleteRisk.HIGH);
        m.put("canPurge", risk != DeleteRisk.BLOCKED);
        m.put("references", refs.stream().map(Reference::toMap).toList());
        return m;
    }

    /**
     * 彻底删除。
     *
     * @param password 高危档必填（当前管理员的登录密码）；低危档忽略
     */
    @Transactional
    public void purge(String type, Long id, String password) {
        adminPermissionService.require("admin:super");
        ContentType t = ContentType.of(type);
        String name = requireDeletedName(t, id);

        List<Reference> refs = collectReferences(t, id);
        DeleteRisk risk = resolveRisk(refs);

        if (risk == DeleteRisk.BLOCKED) {
            throw new BusinessException(400, blockedMessage(name, refs));
        }
        if (risk == DeleteRisk.HIGH) {
            dangerousActionGuard.verifyCurrentAdminPassword(password);
        }

        // 必须在物理删行之前收集；OSS 删除等提交成功后再做，失败不挡回收站
        List<String> media = ossMediaCleanupService.collectStoredFor(t.name(), id);
        if (media == null) {
            media = List.of();
        }

        purgeBehaviourReferences(t, id);
        for (String[] child : t.children) {
            recycleBinMapper.purgeChildren(child[0], child[1], id);
        }
        if (t == ContentType.sys_user) {
            // 活动本身留着，只解除署名——历史活动不该因为经办人离职而消失
            recycleBinMapper.detachActivityCreator(id);
        }

        int n = recycleBinMapper.purge(t.table, id);
        if (n == 0) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }
        ossMediaCleanupService.releaseStored(media);
    }

    private String requireDeletedName(ContentType t, Long id) {
        String name = recycleBinMapper.findDeletedName(t.table, t.nameCol, id);
        if (name == null) {
            throw new BusinessException(404, "该内容不在回收站中，可能已被恢复或彻底删除");
        }
        // 名称列可空（如没填标题的 Banner）；确认框里总得有个能读的称呼
        return name.isBlank() ? "（未命名" + t.label + "）" : name;
    }

    private static DeleteRisk resolveRisk(List<Reference> refs) {
        if (refs.stream().anyMatch(Reference::blocking)) {
            return DeleteRisk.BLOCKED;
        }
        return refs.isEmpty() ? DeleteRisk.LOW : DeleteRisk.HIGH;
    }

    private static String blockedMessage(String name, List<Reference> refs) {
        String detail = refs.stream()
                .filter(Reference::blocking)
                .map(r -> r.label() + " " + r.count() + " 条")
                .reduce((a, b) -> a + "、" + b)
                .orElse("");
        return "「" + name + "」还被 " + detail + " 引用，请先把这些内容改到别的分类或角色，再回来彻底删除。";
    }

    /** 汇总这条记录连着的所有东西：行为类可随删除一并清理，结构类必须先迁走。 */
    private List<Reference> collectReferences(ContentType t, Long id) {
        List<Reference> refs = new ArrayList<>();

        if (t.interactive) {
            addIfAny(refs, "收藏", recycleBinMapper.countFavorite(t.name(), id),
                    false, "彻底删除后，这些收藏会一并消失");
            addIfAny(refs, "点赞", recycleBinMapper.countLike(t.name(), id),
                    false, "彻底删除后，这些点赞会一并消失");
        }

        switch (t) {
            case activity -> addIfAny(refs, "报名记录", recycleBinMapper.countEnroll(id),
                    false, "含已核销的凭证；往年的报名人数已计入统计快照，不受影响");
            case resource -> addIfAny(refs, "下载记录", recycleBinMapper.countDownload(id),
                    false, "彻底删除后，这些下载明细会一并消失");
            case course -> addIfAny(refs, "学习记录", recycleBinMapper.countCourseProgress(id),
                    false, "含学员的学习进度；完课率已计入统计快照，不受影响");
            case category -> {
                for (String[] user : CATEGORY_USERS) {
                    addIfAny(refs, user[1], recycleBinMapper.countByCategoryState(user[0], id, IN_USE),
                            true, "请先把这些" + user[1] + "改到别的分类");
                    // 回收站里的内容不在任何列表里，光说「改到别的分类」老师根本找不到它们
                    addIfAny(refs, user[1] + "（在回收站）",
                            recycleBinMapper.countByCategoryState(user[0], id, IN_RECYCLE_BIN),
                            true, "先在回收站里彻底删除这些" + user[1]
                                    + "，或恢复后改分类再删——恢复回来分类没了会成为孤儿");
                }
            }
            case sys_role -> {
                addIfAny(refs, "管理员账号", recycleBinMapper.countAdminsWithRoleState(id, IN_USE),
                        true, "请先把这些账号改到别的角色");
                addIfAny(refs, "管理员账号（在回收站）",
                        recycleBinMapper.countAdminsWithRoleState(id, IN_RECYCLE_BIN),
                        true, "先在回收站里彻底删除这些账号，或恢复后改角色再删");
            }
            case sys_user -> addIfAny(refs, "创建的活动", recycleBinMapper.countActivitiesCreatedBy(id),
                    false, "活动会保留，仅解除创建人署名");
            default -> {
                // 公告 / Banner / 书院应用 / 导航项等纯配置项没有额外引用
            }
        }
        return refs;
    }

    private static void addIfAny(List<Reference> refs, String label, long count, boolean blocking, String hint) {
        if (count > 0) {
            refs.add(new Reference(label, count, blocking, hint));
        }
    }

    /** 清理行为类引用行。结构类不在此列——它们要么已把删除挡下，要么另有处理。 */
    private void purgeBehaviourReferences(ContentType t, Long id) {
        if (t.interactive) {
            recycleBinMapper.purgeFavorite(t.name(), id);
            recycleBinMapper.purgeLike(t.name(), id);
        }
        switch (t) {
            case activity -> recycleBinMapper.purgeEnroll(id);
            case resource -> recycleBinMapper.purgeDownload(id);
            case course -> recycleBinMapper.purgeCourseProgress(id);
            default -> {
                // 其余类型没有行为类引用
            }
        }
    }
}
