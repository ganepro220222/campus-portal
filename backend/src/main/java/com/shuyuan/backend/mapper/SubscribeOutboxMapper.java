package com.shuyuan.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuyuan.backend.entity.SubscribeOutbox;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

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

    /**
     * 后台「重新发送」：把一条终态失败/跳过的记录放回队列。
     *
     * <p>attempt_count 必须清零——processOne() 在 attemptCount &gt; maxAttempts 时会直接判失败，
     * 不清零的话重发会原地再失败一次。
     *
     * <p>只接受 failed / skipped：pending 与 processing 本来就在队列里，重复入队会重复发送。
     */
    @Update("""
            UPDATE subscribe_outbox
            SET status = 'pending',
                next_retry_at = NOW(),
                attempt_count = 0,
                locked_at = NULL,
                last_error = NULL,
                sent_at = NULL,
                update_time = NOW()
            WHERE id = #{id}
              AND status IN ('failed', 'skipped')
            """)
    int requeueForRetry(@Param("id") Long id);

    /**
     * 按终态分批清理过期记录。
     *
     * <p>只删已进入终态的行：pending / processing 是还没投递完的活儿，任何时候都不能删。
     * status 由调用方从固定常量传入，不接受外部输入。
     */
    @Delete("""
            DELETE FROM subscribe_outbox
            WHERE status = #{status}
              AND create_time < #{before}
            LIMIT #{limit}
            """)
    int deleteByStatusBefore(@Param("status") String status,
                             @Param("before") LocalDateTime before,
                             @Param("limit") int limit);
}
