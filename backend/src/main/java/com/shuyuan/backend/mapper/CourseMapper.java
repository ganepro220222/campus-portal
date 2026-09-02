package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Course;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CourseMapper extends BaseMapper<Course> {

    /** 课程媒体/字幕状态切换需锁行，避免在途 ASR 与人工保存互相覆盖。 */
    @Select("SELECT * FROM course WHERE id = #{id} AND is_deleted = 0 FOR UPDATE")
    Course selectByIdForUpdate(@Param("id") Long id);
}
