package com.shuyuan.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 素材引用扫描。用原生 SQL，避免 MyBatis-Plus 逻辑删除把回收站行滤掉。
 *
 * <p>父表（课程/动态等）含 {@code is_deleted=1}：进回收站还要能恢复，对象必须留着。
 * 子表 {@code hall_media}/{@code craft_image} 只数未删除行：编辑替换后的旧行是软删，应当允许清 OSS。
 * 协议正文（{@code sys_config}）和学员反馈附图（{@code feedback}）也必须计入，否则定时扫孤儿会误删仍在展示的图。
 * {@code member.avatar} / {@code enroll.qr_code_url} 今天没人写入 OSS 地址，仍纳入扫描：
 * 将来有人往里存了本桶对象，漏在这里的代价是被扫孤儿误删，多两个子查询的代价可以忽略。
 */
@Mapper
public interface OssMediaRefMapper {

    @Select("""
            SELECT (
              (SELECT COUNT(*) FROM course WHERE cover LIKE CONCAT('%', #{key}, '%')
                OR video_url LIKE CONCAT('%', #{key}, '%')
                OR subtitle_url LIKE CONCAT('%', #{key}, '%')
                OR intro LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM resource WHERE file_url LIKE CONCAT('%', #{key}, '%')
                OR preview_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM news WHERE cover LIKE CONCAT('%', #{key}, '%')
                OR content LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM hall WHERE cover LIKE CONCAT('%', #{key}, '%')
                OR intro LIKE CONCAT('%', #{key}, '%')
                OR vr_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM hall_media WHERE is_deleted = 0
                AND url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM craft WHERE cover LIKE CONCAT('%', #{key}, '%')
                OR intro_zh LIKE CONCAT('%', #{key}, '%')
                OR intro_en LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM craft_image WHERE is_deleted = 0
                AND image_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM activity WHERE cover LIKE CONCAT('%', #{key}, '%')
                OR intro LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM banner WHERE image_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM college_app WHERE icon_url LIKE CONCAT('%', #{key}, '%')
                OR content_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM knowledge_doc WHERE file_url LIKE CONCAT('%', #{key}, '%')
                OR content LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM knowledge_chunk WHERE chunk_text LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM search_index WHERE cover LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM badge WHERE icon_url LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM announcement WHERE content LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM sys_config WHERE config_value LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM feedback WHERE images LIKE CONCAT('%', #{key}, '%')
                OR content LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM member WHERE avatar LIKE CONCAT('%', #{key}, '%'))
            + (SELECT COUNT(*) FROM enroll WHERE qr_code_url LIKE CONCAT('%', #{key}, '%'))
            ) AS cnt
            """)
    long countReferences(@Param("key") String key);

    @Select("SELECT cover, video_url, subtitle_url, intro FROM course WHERE id = #{id}")
    Map<String, Object> findCourseMedia(@Param("id") Long id);

    @Select("SELECT file_url, preview_url FROM resource WHERE id = #{id}")
    Map<String, Object> findResourceMedia(@Param("id") Long id);

    @Select("SELECT cover, content FROM news WHERE id = #{id}")
    Map<String, Object> findNewsMedia(@Param("id") Long id);

    @Select("SELECT cover, intro, vr_url FROM hall WHERE id = #{id}")
    Map<String, Object> findHallMedia(@Param("id") Long id);

    @Select("SELECT url FROM hall_media WHERE hall_id = #{id}")
    List<String> findHallMediaUrls(@Param("id") Long id);

    @Select("SELECT cover, intro_zh, intro_en FROM craft WHERE id = #{id}")
    Map<String, Object> findCraftMedia(@Param("id") Long id);

    @Select("SELECT image_url FROM craft_image WHERE craft_id = #{id}")
    List<String> findCraftImageUrls(@Param("id") Long id);

    @Select("SELECT cover, intro FROM activity WHERE id = #{id}")
    Map<String, Object> findActivityMedia(@Param("id") Long id);

    @Select("SELECT image_url FROM banner WHERE id = #{id}")
    Map<String, Object> findBannerMedia(@Param("id") Long id);

    @Select("SELECT icon_url, content_url FROM college_app WHERE id = #{id}")
    Map<String, Object> findCollegeAppMedia(@Param("id") Long id);

    @Select("SELECT content FROM announcement WHERE id = #{id}")
    Map<String, Object> findAnnouncementMedia(@Param("id") Long id);
}
