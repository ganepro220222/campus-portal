package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.SysLog;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface SysLogMapper extends BaseMapper<SysLog> {

    /** 按时间分批删除过期操作日志，走 idx_created_at */
    @Delete("DELETE FROM sys_log WHERE created_at < #{before} LIMIT #{limit}")
    int deleteCreatedBefore(@Param("before") LocalDateTime before, @Param("limit") int limit);
}
