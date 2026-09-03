package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.LikeRecord;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LikeRecordMapper extends BaseMapper<LikeRecord> {

    /** 点赞取消须物理删除：软删行仍占 uk_member_target，无法再赞 */
    @Delete("DELETE FROM like_record WHERE id = #{id}")
    int physicalDeleteById(@Param("id") Long id);

    /** 取消点赞带会员条件，affected==0 时不得再扣计数 */
    @Delete("DELETE FROM like_record WHERE id = #{id} AND member_id = #{memberId}")
    int physicalDeleteByIdAndMember(@Param("id") Long id, @Param("memberId") Long memberId);

    /** 只清软删残留，避免并发 insert 后误删对方刚写入的有效点赞 */
    @Delete("DELETE FROM like_record WHERE member_id = #{memberId} AND target_type = #{targetType} "
            + "AND target_id = #{targetId} AND is_deleted = 1")
    int physicalDeleteByTarget(@Param("memberId") Long memberId,
                               @Param("targetType") String targetType,
                               @Param("targetId") Long targetId);
}
