package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.dto.ContentViewAggregate;
import com.shuyuan.backend.dto.StatsDailyAggregate;
import com.shuyuan.backend.entity.EventLog;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface EventLogMapper extends BaseMapper<EventLog> {

    /**
     * 按时间分批删除过期明细。带 LIMIT 是为了避免一条 DELETE 锁住整张表——
     * event_log 是学生端写入最频繁的表，长事务会直接顶到前台。
     * 只删除已经有 stat_daily 聚合结果的日期，防止调度失败时永久丢失统计明细。
     * 时间范围走 idx_created_at。
     */
    @Delete("""
            DELETE FROM event_log
            WHERE created_at < #{before}
              AND EXISTS (
                SELECT 1
                FROM stat_daily
                WHERE stat_daily.date = DATE(event_log.created_at)
              )
            ORDER BY created_at
            LIMIT #{limit}
            """)
    int deleteCreatedBefore(@Param("before") LocalDateTime before, @Param("limit") int limit);

    @Select("""
            SELECT COUNT(*) AS pv,
                   COUNT(DISTINCT member_id) AS uv
            FROM event_log
            WHERE created_at >= #{start}
              AND created_at < #{end}
            """)
    @Results(id = "statsDailyAggregate", value = {
            @Result(column = "pv", property = "pv"),
            @Result(column = "uv", property = "uv")
    })
    StatsDailyAggregate aggregateDaily(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Select("""
            SELECT target_type AS targetType,
                   COUNT(*) AS viewCount
            FROM event_log
            WHERE event_type = 'view'
              AND created_at >= #{since}
              AND target_type IS NOT NULL
            GROUP BY target_type
            ORDER BY viewCount DESC, targetType ASC
            """)
    @Results(id = "moduleViewAggregate", value = {
            @Result(column = "targetType", property = "targetType"),
            @Result(column = "viewCount", property = "viewCount")
    })
    List<ContentViewAggregate> aggregateModuleViews(@Param("since") LocalDateTime since);

    @Select("""
            SELECT target_type AS targetType,
                   target_id AS targetId,
                   COUNT(*) AS viewCount
            FROM event_log
            WHERE event_type = 'view'
              AND created_at >= #{start}
              AND created_at < #{end}
              AND target_type IS NOT NULL
              AND target_id IS NOT NULL
            GROUP BY target_type, target_id
            """)
    @Results(id = "contentViewAggregate", value = {
            @Result(column = "targetType", property = "targetType"),
            @Result(column = "targetId", property = "targetId"),
            @Result(column = "viewCount", property = "viewCount")
    })
    List<ContentViewAggregate> aggregateContentViews(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Select("""
            <script>
            SELECT target_type AS targetType,
                   target_id AS targetId,
                   COUNT(*) AS viewCount
            FROM event_log
            WHERE event_type = 'view'
              AND created_at >= #{since}
              AND target_type IS NOT NULL
              AND target_id IS NOT NULL
            <if test="targetType != null and targetType != ''">
              AND target_type = #{targetType}
            </if>
            GROUP BY target_type, target_id
            ORDER BY viewCount DESC, targetType ASC, targetId ASC
            LIMIT #{limit}
            </script>
            """)
    @ResultMap("contentViewAggregate")
    List<ContentViewAggregate> aggregateTopViews(
            @Param("since") LocalDateTime since,
            @Param("targetType") String targetType,
            @Param("limit") int limit);
}
