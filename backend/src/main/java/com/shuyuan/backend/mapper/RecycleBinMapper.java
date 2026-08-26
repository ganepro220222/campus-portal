package com.shuyuan.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

/**
 * 回收站原生映射器。
 *
 * <p>全局逻辑删除（is_deleted）会被自动注入到 BaseMapper 的方法上，导致无法查询/操作已删除行，
 * 因此这里使用带显式 SQL 的自定义方法（不会被追加逻辑删除条件）来读取、恢复、彻底删除软删数据。
 *
 * <p>{@code table} / {@code nameCol} / {@code fkCol} 均以 {@code ${}} 拼接，存在 SQL 注入风险，
 * 调用方（RecycleBinService）必须使用白名单常量传入，严禁透传用户输入。
 */
@Mapper
public interface RecycleBinMapper {

    @Select("SELECT id, ${nameCol} AS name, update_time AS deletedTime "
            + "FROM ${table} WHERE is_deleted = 1 ORDER BY update_time DESC")
    List<Map<String, Object>> listDeleted(@Param("table") String table, @Param("nameCol") String nameCol);

    @Select("SELECT COUNT(1) FROM ${table} WHERE is_deleted = 1")
    long countDeleted(@Param("table") String table);

    /**
     * 取已删除行的显示名；行不存在时返回 null。
     *
     * <p>COALESCE 不能省：banner.title 之类的名称列本身可空，直接 SELECT 出来
     * 「有这行但没标题」和「压根没这行」都是 null，会把存在的记录误判成 404。
     */
    @Select("SELECT COALESCE(${nameCol}, '') FROM ${table} WHERE id = #{id} AND is_deleted = 1")
    String findDeletedName(@Param("table") String table, @Param("nameCol") String nameCol, @Param("id") Long id);

    @Update("UPDATE ${table} SET is_deleted = 0 WHERE id = #{id} AND is_deleted = 1")
    int restore(@Param("table") String table, @Param("id") Long id);

    @Delete("DELETE FROM ${table} WHERE id = #{id} AND is_deleted = 1")
    int purge(@Param("table") String table, @Param("id") Long id);

    /** 物理级联删除所属子表（不受逻辑删除约束）。 */
    @Delete("DELETE FROM ${table} WHERE ${fkCol} = #{id}")
    int purgeChildren(@Param("table") String table, @Param("fkCol") String fkCol, @Param("id") Long id);

    // —— 引用计数（彻底删除前的拦截校验，均为业务外键，不含所属子表）——

    @Select("SELECT COUNT(1) FROM favorite WHERE target_type = #{type} AND target_id = #{id}")
    long countFavorite(@Param("type") String type, @Param("id") Long id);

    @Select("SELECT COUNT(1) FROM like_record WHERE target_type = #{type} AND target_id = #{id}")
    long countLike(@Param("type") String type, @Param("id") Long id);

    @Select("SELECT COUNT(1) FROM enroll WHERE activity_id = #{id}")
    long countEnroll(@Param("id") Long id);

    @Select("SELECT COUNT(1) FROM download_record WHERE resource_id = #{id}")
    long countDownload(@Param("id") Long id);

    @Select("SELECT COUNT(1) FROM course_progress WHERE course_id = #{id}")
    long countCourseProgress(@Param("id") Long id);

    // —— 结构性依赖（不是用户行为，删不掉、只能先把依赖迁走）——

    /**
     * 某分类下还挂着多少条内容，按「在用 / 在回收站」分开数。
     *
     * <p>{@code table} 由 RecycleBinService 的白名单常量传入，不接受外部输入。
     *
     * <p>为什么必须分开：两种都得挡住删除（回收站里的内容能被恢复，恢复回来分类没了就成了孤儿），
     * 但处置办法完全不同。在用的去列表里改分类就行；在回收站里的**根本不在列表里**，
     * 只提示「请改到别的分类」的话，老师翻遍后台也找不到那几条。
     *
     * @param deleted 0=在用，1=在回收站
     */
    @Select("SELECT COUNT(1) FROM ${table} WHERE category_id = #{id} AND is_deleted = #{deleted}")
    long countByCategoryState(@Param("table") String table, @Param("id") Long id,
                              @Param("deleted") int deleted);

    /**
     * 某角色下还挂着多少个管理员账号。
     *
     * @param deleted 0=在用，1=在回收站（同样够不着，得单独给处置说明）
     */
    @Select("SELECT COUNT(1) FROM sys_user WHERE role_id = #{id} AND is_deleted = #{deleted}")
    long countAdminsWithRoleState(@Param("id") Long id, @Param("deleted") int deleted);

    /** 某管理员创建过多少个活动（activity.created_by 可空，属弱引用） */
    @Select("SELECT COUNT(1) FROM activity WHERE created_by = #{id}")
    long countActivitiesCreatedBy(@Param("id") Long id);

    // —— 彻底删除时的级联清理（行为类引用，随内容一并消失）——

    @Delete("DELETE FROM favorite WHERE target_type = #{type} AND target_id = #{id}")
    int purgeFavorite(@Param("type") String type, @Param("id") Long id);

    @Delete("DELETE FROM like_record WHERE target_type = #{type} AND target_id = #{id}")
    int purgeLike(@Param("type") String type, @Param("id") Long id);

    @Delete("DELETE FROM enroll WHERE activity_id = #{id}")
    int purgeEnroll(@Param("id") Long id);

    @Delete("DELETE FROM download_record WHERE resource_id = #{id}")
    int purgeDownload(@Param("id") Long id);

    @Delete("DELETE FROM course_progress WHERE course_id = #{id}")
    int purgeCourseProgress(@Param("id") Long id);

    /** 管理员被彻底删除后，其创建过的活动保留，仅解除署名 */
    @Update("UPDATE activity SET created_by = NULL WHERE created_by = #{id}")
    int detachActivityCreator(@Param("id") Long id);
}
