package com.shuyuan.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 师生账号的引用统计与物理清理。
 *
 * <p>一律用显式 SQL：这些表大多带全局逻辑删除，走 BaseMapper 会被自动追加 is_deleted 条件，
 * 于是「已软删的报名」查不到、清不掉——而软删的行照样占着 member_id 与唯一键。
 *
 * <p>member_id 由 AdminMemberService 从路径参数解析成 Long 后传入，不存在拼接注入面。
 */
@Mapper
public interface MemberPurgeMapper {

    // —— 阻断物理删除的业务记录：有这些就只能清退，不能抹掉 ——

    @Select("SELECT COUNT(1) FROM enroll WHERE member_id = #{memberId}")
    long countEnroll(@Param("memberId") Long memberId);

    @Select("SELECT COUNT(1) FROM point_record WHERE member_id = #{memberId}")
    long countPointRecord(@Param("memberId") Long memberId);

    @Select("SELECT COUNT(1) FROM course_progress WHERE member_id = #{memberId}")
    long countCourseProgress(@Param("memberId") Long memberId);

    @Select("SELECT COUNT(1) FROM feedback WHERE member_id = #{memberId}")
    long countFeedback(@Param("memberId") Long memberId);

    @Select("SELECT COUNT(1) FROM member_badge WHERE member_id = #{memberId}")
    long countBadge(@Param("memberId") Long memberId);

    // —— 随账号一并消失的私有痕迹 ——

    @Delete("DELETE FROM favorite WHERE member_id = #{memberId}")
    int purgeFavorite(@Param("memberId") Long memberId);

    @Delete("DELETE FROM like_record WHERE member_id = #{memberId}")
    int purgeLike(@Param("memberId") Long memberId);

    @Delete("DELETE FROM download_record WHERE member_id = #{memberId}")
    int purgeDownload(@Param("memberId") Long memberId);

    @Delete("DELETE FROM message WHERE member_id = #{memberId}")
    int purgeMessage(@Param("memberId") Long memberId);

    @Delete("DELETE FROM share_record WHERE member_id = #{memberId}")
    int purgeShareRecord(@Param("memberId") Long memberId);

    @Delete("DELETE FROM member_subscribe_record WHERE member_id = #{memberId}")
    int purgeSubscribeRecord(@Param("memberId") Long memberId);

    @Delete("DELETE FROM subscribe_outbox WHERE member_id = #{memberId}")
    int purgeSubscribeOutbox(@Param("memberId") Long memberId);

    @Delete("DELETE FROM event_log WHERE member_id = #{memberId}")
    int purgeEventLog(@Param("memberId") Long memberId);

    /** 先删子表：ai_message 只挂 session_id，父会话没了就再也定位不到 */
    @Delete("""
            DELETE FROM ai_message
            WHERE session_id IN (
              SELECT id FROM (SELECT id FROM ai_session WHERE member_id = #{memberId}) AS s
            )
            """)
    int purgeAiMessages(@Param("memberId") Long memberId);

    @Delete("DELETE FROM ai_session WHERE member_id = #{memberId}")
    int purgeAiSessions(@Param("memberId") Long memberId);

    // —— 账号三件套 ——

    @Delete("DELETE FROM member_account WHERE member_id = #{memberId}")
    int purgeAccount(@Param("memberId") Long memberId);

    @Delete("DELETE FROM member_profile WHERE member_id = #{memberId}")
    int purgeProfile(@Param("memberId") Long memberId);

    @Delete("DELETE FROM member WHERE id = #{memberId}")
    int purgeMember(@Param("memberId") Long memberId);
}
