package com.shuyuan.backend.service;

import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.mapper.RecycleBinMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 彻底删除的分档规则。
 *
 * <p>原实现是「只要有一条收藏就永久拦死」——一个实习生随手点的赞能让一条演示新闻再也删不掉，
 * 于是清演示数据只能上服务器手写 SQL。现在改成按影响面分三档，每一档都有出口。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RecycleBinServiceTest {

    @Mock
    private RecycleBinMapper recycleBinMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private DangerousActionGuard dangerousActionGuard;
    @Mock
    private AdminAnnouncementService adminAnnouncementService;

    @InjectMocks
    private RecycleBinService recycleBinService;

    private void deletedRow(String table, String nameCol, long id, String name) {
        when(recycleBinMapper.findDeletedName(eq(table), eq(nameCol), eq(id))).thenReturn(name);
    }

    // ---------- LOW：无引用，二次确认即可 ----------

    @Test
    void 无引用的演示内容属于低危且不需要密码() {
        deletedRow("banner", "title", 1L, "首页演示 Banner");

        Map<String, Object> impact = recycleBinService.impact("banner", 1L);

        assertEquals("LOW", impact.get("risk"));
        assertEquals(Boolean.FALSE, impact.get("requiresPassword"));
        assertEquals(Boolean.TRUE, impact.get("canPurge"));
        assertTrue(((List<?>) impact.get("references")).isEmpty());
    }

    @Test
    void 低危彻底删除不校验密码直接落库() {
        deletedRow("nav_item", "label", 2L, "演示导航");
        when(recycleBinMapper.purge("nav_item", 2L)).thenReturn(1);

        recycleBinService.purge("nav_item", 2L, null);

        verify(dangerousActionGuard, never()).verifyCurrentAdminPassword(any());
        verify(recycleBinMapper).purge("nav_item", 2L);
    }

    /** 公告 / Banner 这类配置项在小程序端不可收藏点赞，不该白跑两条 count */
    @Test
    void 非互动类型不查收藏点赞() {
        deletedRow("announcement", "content", 3L, "演示公告");

        recycleBinService.impact("announcement", 3L);

        verify(recycleBinMapper, never()).countFavorite(anyString(), anyLong());
        verify(recycleBinMapper, never()).countLike(anyString(), anyLong());
    }

    /** banner.title 可空：有这行但没标题，不能被当成「记录不存在」 */
    @Test
    void 名称为空的记录不会被误判成不存在() {
        deletedRow("banner", "title", 4L, "");
        when(recycleBinMapper.purge("banner", 4L)).thenReturn(1);

        Map<String, Object> impact = recycleBinService.impact("banner", 4L);

        assertEquals("（未命名轮播图）", impact.get("name"));
    }

    // ---------- HIGH：有行为引用，明示影响 + 超管密码 ----------

    @Test
    void 有报名记录的活动属于高危且要密码() {
        deletedRow("activity", "title", 10L, "非遗研学讲座");
        when(recycleBinMapper.countEnroll(10L)).thenReturn(37L);
        when(recycleBinMapper.countFavorite("activity", 10L)).thenReturn(5L);

        Map<String, Object> impact = recycleBinService.impact("activity", 10L);

        assertEquals("HIGH", impact.get("risk"));
        assertEquals(Boolean.TRUE, impact.get("requiresPassword"));
        assertEquals(Boolean.TRUE, impact.get("canPurge"));

        List<?> refs = (List<?>) impact.get("references");
        assertEquals(2, refs.size());
        Map<?, ?> favorite = (Map<?, ?>) refs.get(0);
        assertEquals("收藏", favorite.get("label"));
        assertEquals(5L, favorite.get("count"));
        assertEquals(Boolean.FALSE, favorite.get("blocking"));
        Map<?, ?> enroll = (Map<?, ?>) refs.get(1);
        assertEquals("报名记录", enroll.get("label"));
        assertEquals(37L, enroll.get("count"));
    }

    @Test
    void 高危删除会校验密码并级联清理行为数据() {
        deletedRow("activity", "title", 10L, "非遗研学讲座");
        when(recycleBinMapper.countEnroll(10L)).thenReturn(37L);
        when(recycleBinMapper.purge("activity", 10L)).thenReturn(1);

        recycleBinService.purge("activity", 10L, "correct-horse");

        verify(dangerousActionGuard).verifyCurrentAdminPassword("correct-horse");
        verify(recycleBinMapper).purgeEnroll(10L);
        verify(recycleBinMapper).purgeFavorite("activity", 10L);
        verify(recycleBinMapper).purgeLike("activity", 10L);
        verify(recycleBinMapper).purge("activity", 10L);
    }

    @Test
    void 高危删除密码不对时不落库() {
        deletedRow("course", "name", 11L, "篆刻入门");
        when(recycleBinMapper.countCourseProgress(11L)).thenReturn(4L);
        org.mockito.Mockito.doThrow(new BusinessException(400, "管理员密码不正确"))
                .when(dangerousActionGuard).verifyCurrentAdminPassword(any());

        assertThrows(BusinessException.class, () -> recycleBinService.purge("course", 11L, "wrong"));

        verify(recycleBinMapper, never()).purge(anyString(), anyLong());
        verify(recycleBinMapper, never()).purgeCourseProgress(anyLong());
    }

    // ---------- BLOCKED：结构性依赖，先迁走再删 ----------

    @Test
    void 分类下还挂着内容时受阻并说清怎么处理() {
        deletedRow("category", "name", 20L, "非遗技艺");
        when(recycleBinMapper.countByCategoryState("news", 20L, 0)).thenReturn(3L);
        when(recycleBinMapper.countByCategoryState("course", 20L, 0)).thenReturn(1L);

        Map<String, Object> impact = recycleBinService.impact("category", 20L);
        assertEquals("BLOCKED", impact.get("risk"));
        assertEquals(Boolean.FALSE, impact.get("canPurge"));
        List<?> refs = (List<?>) impact.get("references");
        assertEquals(2, refs.size());
        assertEquals(Boolean.TRUE, ((Map<?, ?>) refs.get(0)).get("blocking"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> recycleBinService.purge("category", 20L, "any"));
        assertTrue(ex.getMessage().contains("动态 3 条"), ex.getMessage());
        assertTrue(ex.getMessage().contains("课程 1 条"), ex.getMessage());
        verify(recycleBinMapper, never()).purge(anyString(), anyLong());
        // 受阻档不该先把密码收走——老师还没得选就被要密码是种误导
        verify(dangerousActionGuard, never()).verifyCurrentAdminPassword(any());
    }

    @Test
    void 角色下还挂着管理员时受阻() {
        deletedRow("sys_role", "role_name", 21L, "内容审核员");
        when(recycleBinMapper.countAdminsWithRoleState(21L, 0)).thenReturn(2L);

        Map<String, Object> impact = recycleBinService.impact("sys_role", 21L);

        assertEquals("BLOCKED", impact.get("risk"));
        assertEquals(Boolean.FALSE, impact.get("canPurge"));
    }

    /**
     * 挡住删除的内容如果本身也在回收站里，提示必须换一种说法。
     *
     * <p>回收站里的新闻不出现在新闻列表里，只说「请改到别的分类」老师翻遍后台也找不到它，
     * 「先处理依赖再回来删」就成了死路。
     */
    @Test
    void 挡路的内容在回收站里时提示要给出够得着的办法() {
        deletedRow("category", "name", 23L, "旧分类");
        when(recycleBinMapper.countByCategoryState("news", 23L, 1)).thenReturn(2L);

        Map<String, Object> impact = recycleBinService.impact("category", 23L);

        assertEquals("BLOCKED", impact.get("risk"));
        List<?> refs = (List<?>) impact.get("references");
        assertEquals(1, refs.size());
        Map<?, ?> ref = (Map<?, ?>) refs.get(0);
        assertEquals("动态（在回收站）", ref.get("label"));
        String hint = String.valueOf(ref.get("hint"));
        assertTrue(hint.contains("回收站"), hint);
        assertTrue(hint.contains("彻底删除"), hint);
        // 不能只说「改到别的分类」——那几条根本不在列表里
        assertFalse(hint.equals("请先把这些动态改到别的分类"), hint);
    }

    @Test
    void 在用与回收站里的挡路内容分开列() {
        deletedRow("category", "name", 24L, "混合分类");
        when(recycleBinMapper.countByCategoryState("news", 24L, 0)).thenReturn(1L);
        when(recycleBinMapper.countByCategoryState("news", 24L, 1)).thenReturn(2L);

        List<?> refs = (List<?>) recycleBinService.impact("category", 24L).get("references");

        assertEquals(2, refs.size());
        assertEquals("动态", ((Map<?, ?>) refs.get(0)).get("label"));
        assertEquals(1L, ((Map<?, ?>) refs.get(0)).get("count"));
        assertEquals("动态（在回收站）", ((Map<?, ?>) refs.get(1)).get("label"));
        assertEquals(2L, ((Map<?, ?>) refs.get(1)).get("count"));
    }

    @Test
    void 空分类可以直接删() {
        deletedRow("category", "name", 22L, "已弃用分类");
        when(recycleBinMapper.purge("category", 22L)).thenReturn(1);

        recycleBinService.purge("category", 22L, null);

        verify(recycleBinMapper).purge("category", 22L);
    }

    // ---------- 管理员账号：活动保留、仅解除署名 ----------

    @Test
    void 彻底删除管理员会保留其创建的活动只解除署名() {
        deletedRow("sys_user", "username", 30L, "zhangsan");
        when(recycleBinMapper.countActivitiesCreatedBy(30L)).thenReturn(6L);
        when(recycleBinMapper.purge("sys_user", 30L)).thenReturn(1);

        Map<String, Object> impact = recycleBinService.impact("sys_user", 30L);
        assertEquals("HIGH", impact.get("risk"));
        assertEquals(Boolean.FALSE, ((Map<?, ?>) ((List<?>) impact.get("references")).get(0)).get("blocking"));

        recycleBinService.purge("sys_user", 30L, "pwd");

        verify(recycleBinMapper).detachActivityCreator(30L);
        verify(recycleBinMapper).purge("sys_user", 30L);
    }

    // ---------- 恢复：按类型强制安全态 ----------

    @Test
    void 恢复公告会禁用并清除小程序缓存() {
        when(recycleBinMapper.restoreDisabled("announcement", 5L)).thenReturn(1);

        recycleBinService.restore("announcement", 5L);

        verify(recycleBinMapper).restoreDisabled("announcement", 5L);
        verify(recycleBinMapper, never()).restore(anyString(), anyLong());
        verify(adminAnnouncementService).evictActiveCache();
    }

    @Test
    void 恢复轮播图会强制禁用() {
        when(recycleBinMapper.restoreDisabled("banner", 6L)).thenReturn(1);

        recycleBinService.restore("banner", 6L);

        verify(recycleBinMapper).restoreDisabled("banner", 6L);
        verify(adminAnnouncementService, never()).evictActiveCache();
    }

    @Test
    void 恢复管理员账号会禁用并递增tokenVersion() {
        when(recycleBinMapper.restoreSysUserDisabled(30L)).thenReturn(1);

        recycleBinService.restore("sys_user", 30L);

        verify(recycleBinMapper).restoreSysUserDisabled(30L);
        verify(recycleBinMapper, never()).restore(anyString(), anyLong());
        verify(recycleBinMapper, never()).restoreDisabled(anyString(), anyLong());
    }

    @Test
    void 恢复动态保留原状态仅清除软删标记() {
        when(recycleBinMapper.restore("news", 7L)).thenReturn(1);

        recycleBinService.restore("news", 7L);

        verify(recycleBinMapper).restore("news", 7L);
        verify(recycleBinMapper, never()).restoreDisabled(anyString(), anyLong());
    }

    @Test
    void 不在回收站的记录恢复时报404() {
        when(recycleBinMapper.restoreDisabled("nav_item", 99L)).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> recycleBinService.restore("nav_item", 99L));
        assertEquals(404, ex.getCode());
    }

    // ---------- 通用 ----------

    @Test
    void 不在回收站的记录报404() {
        when(recycleBinMapper.findDeletedName(anyString(), anyString(), anyLong())).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> recycleBinService.purge("news", 99L, null));
        assertEquals(404, ex.getCode());
    }

    @Test
    void 不认识的类型报400() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> recycleBinService.impact("event_log", 1L));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("不支持的内容类型"));
    }

    /** 概览要覆盖全部类型：漏了哪类，那类就永远进不了回收站界面 */
    @Test
    void 概览覆盖所有可回收类型() {
        List<Map<String, Object>> summary = recycleBinService.summary();
        List<String> types = summary.stream().map(m -> String.valueOf(m.get("type"))).toList();

        for (String expected : List.of("news", "hall", "craft", "course", "resource", "activity",
                "announcement", "banner", "category", "college_app", "nav_item", "sys_role", "sys_user")) {
            assertTrue(types.contains(expected), "概览缺少类型 " + expected);
        }
        assertEquals(13, types.size());

        // 分组必须齐全：前端按 group 分栏渲染，漏了就会掉进「其他」
        for (Map<String, Object> row : summary) {
            String group = String.valueOf(row.get("group"));
            assertTrue(List.of("内容", "站点配置", "系统").contains(group),
                    row.get("type") + " 的分组不合法：" + group);
        }
        assertFalse(types.contains("event_log"), "日志不该出现在回收站：可挑着删的日志就不是证据");
    }
}
