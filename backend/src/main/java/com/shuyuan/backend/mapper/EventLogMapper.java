package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.EventLog;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface EventLogMapper extends BaseMapper<EventLog> {

    /**
     * 按时间分批删除过期明细。带 LIMIT 是为了避免一条 DELETE 锁住整张表——
     * event_log 是学生端写入最频繁的表，长事务会直接顶到前台。
     * 走 idx_created_at。
     */
    @Delete("DELETE FROM event_log WHERE created_at < #{before} LIMIT #{limit}")
    int deleteCreatedBefore(@Param("before") LocalDateTime before, @Param("limit") int limit);
}
