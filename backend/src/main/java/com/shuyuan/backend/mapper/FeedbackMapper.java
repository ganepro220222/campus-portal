package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.Feedback;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FeedbackMapper extends BaseMapper<Feedback> {

    /**
     * 管理端删除必须物理去掉行。走 {@code deleteById} 只会软删，
     * 行还在，师生账号清退统计仍会把它当成「留下过反馈」。
     */
    @Delete("DELETE FROM feedback WHERE id = #{id}")
    int purgeById(@Param("id") Long id);
}
