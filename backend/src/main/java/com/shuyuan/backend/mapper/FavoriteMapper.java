package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Favorite;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {

    /** 收藏取消须物理删除：软删行仍占 uk_member_target，无法再收藏 */
    @Delete("DELETE FROM favorite WHERE id = #{id}")
    int physicalDeleteById(@Param("id") Long id);

    @Delete("DELETE FROM favorite WHERE member_id = #{memberId} AND target_type = #{targetType} AND target_id = #{targetId}")
    int physicalDeleteByTarget(@Param("memberId") Long memberId,
                               @Param("targetType") String targetType,
                               @Param("targetId") Long targetId);
}
