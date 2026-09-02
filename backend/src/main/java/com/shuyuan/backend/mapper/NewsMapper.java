package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.News;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface NewsMapper extends BaseMapper<News> {

    @Update("UPDATE news SET view_count = view_count + #{delta} WHERE id = #{id} AND is_deleted = 0")
    int incrementViewCount(@Param("id") Long id, @Param("delta") long delta);

    @Update("UPDATE news SET like_count = GREATEST(IFNULL(like_count, 0) + #{delta}, 0) "
            + "WHERE id = #{id} AND is_deleted = 0")
    int adjustLikeCount(@Param("id") Long id, @Param("delta") int delta);

    @Update("UPDATE news SET favorite_count = GREATEST(IFNULL(favorite_count, 0) + #{delta}, 0) "
            + "WHERE id = #{id} AND is_deleted = 0")
    int adjustFavoriteCount(@Param("id") Long id, @Param("delta") int delta);
}
