package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Activity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ActivityMapper extends BaseMapper<Activity> {

    /** 原子扣减名额（quota=0 表示不限） */
    @Update("UPDATE activity SET enrolled_count = enrolled_count + 1 " +
            "WHERE id = #{activityId} AND status = 'published' AND is_deleted = 0 " +
            "AND (quota = 0 OR enrolled_count < quota)")
    int incrEnrolledCount(@Param("activityId") Long activityId);

    /** 释放名额 */
    @Update("UPDATE activity SET enrolled_count = GREATEST(enrolled_count - 1, 0) " +
            "WHERE id = #{activityId} AND is_deleted = 0")
    int decrEnrolledCount(@Param("activityId") Long activityId);
}
