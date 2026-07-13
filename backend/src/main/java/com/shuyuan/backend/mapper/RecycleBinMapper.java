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

    @Select("SELECT ${nameCol} FROM ${table} WHERE id = #{id} AND is_deleted = 1")
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
}
