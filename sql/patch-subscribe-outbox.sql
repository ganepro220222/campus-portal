-- 微信订阅消息发件箱（subscribe_outbox）
-- 新库已并入 init.sql；旧库可重复执行本 patch（整表幂等）
SET @db := DATABASE();

SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = @db AND table_name = 'subscribe_outbox'
        ),
        'SELECT ''skip: subscribe_outbox exists'' AS migration_note',
        'CREATE TABLE `subscribe_outbox` (
          `id`            BIGINT       NOT NULL AUTO_INCREMENT,
          `member_id`     BIGINT       NOT NULL,
          `scene`         VARCHAR(50)  NOT NULL COMMENT ''enroll_success/enroll_approved/activity_remind'',
          `payload_json`  JSON         NOT NULL COMMENT ''活动/报名快照，供 worker 组装模板'',
          `status`        VARCHAR(20)  NOT NULL DEFAULT ''pending'' COMMENT ''pending/processing/sent/skipped/failed'',
          `attempt_count` INT          NOT NULL DEFAULT 0 COMMENT ''已尝试发送次数'',
          `last_error`    VARCHAR(500) DEFAULT NULL,
          `next_retry_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `locked_at`     DATETIME     DEFAULT NULL COMMENT ''worker 认领时间'',
          `sent_at`       DATETIME     DEFAULT NULL,
          `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_status_retry` (`status`, `next_retry_at`),
          KEY `idx_member_scene` (`member_id`, `scene`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=''微信订阅消息发件箱'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验收：
-- SHOW TABLES LIKE 'subscribe_outbox';
