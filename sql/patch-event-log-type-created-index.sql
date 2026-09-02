-- event_log 看板聚合与个人足迹索引（幂等，可重复执行）
--
-- idx_type_created：三条 view 聚合 WHERE event_type='view' AND created_at>=?
-- idx_member_created：学习足迹 WHERE member_id=? AND created_at>=? ORDER BY created_at
-- aggregateDaily 只按时间范围，继续走 idx_created_at
--
-- 新库已并入 init.sql；旧库：
--   mysql ... shuyuan < sql/patch-event-log-type-created-index.sql

SET NAMES utf8mb4;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'event_log'
      AND index_name = 'idx_type_created'
);

SET @ddl := IF(
    @idx_exists = 0,
    'ALTER TABLE `event_log` ADD KEY `idx_type_created` (`event_type`, `created_at`)',
    'SELECT ''skip: idx_type_created already exists'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'event_log'
      AND index_name = 'idx_member_created'
);

SET @ddl := IF(
    @idx_exists = 0,
    'ALTER TABLE `event_log` ADD KEY `idx_member_created` (`member_id`, `created_at`)',
    'SELECT ''skip: idx_member_created already exists'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验收：
-- SHOW INDEX FROM event_log WHERE Key_name IN ('idx_type_created', 'idx_member_created');
