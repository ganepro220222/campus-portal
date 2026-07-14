package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.SubscribeOutbox;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SubscribeOutboxMapper extends BaseMapper<SubscribeOutbox> {

    @Update("""
            UPDATE subscribe_outbox
            SET status = 'processing',
                locked_at = NOW(),
                attempt_count = attempt_count + 1,
                update_time = NOW()
            WHERE id = #{id}
              AND status = 'pending'
              AND next_retry_at <= NOW()
            """)
    int claimPending(@Param("id") Long id);

    @Update("""
            UPDATE subscribe_outbox
            SET status = 'pending',
                next_retry_at = NOW(),
                locked_at = NULL,
                update_time = NOW()
            WHERE status = 'processing'
              AND locked_at IS NOT NULL
              AND locked_at < DATE_SUB(NOW(), INTERVAL #{staleMinutes} MINUTE)
            """)
    int resetStaleProcessing(@Param("staleMinutes") int staleMinutes);

    @Update("""
            UPDATE subscribe_outbox
            SET status = 'pending',
                next_retry_at = NOW(),
                locked_at = NULL,
                last_error = #{reason},
                update_time = NOW()
            WHERE id = #{id}
              AND status = 'processing'
            """)
    int releaseProcessingToRetry(@Param("id") Long id, @Param("reason") String reason);
}
