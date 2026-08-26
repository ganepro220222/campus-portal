-- subscribe_outbox 留存清理索引：DELETE ... WHERE status=? AND create_time<? 走 (status, create_time)
-- 新库已并入 init.sql；旧库可重复执行（幂等）
SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'subscribe_outbox'
      AND index_name = 'idx_status_created'
);

SET @ddl := IF(
    @idx_exists = 0,
    'ALTER TABLE `subscribe_outbox` ADD KEY `idx_status_created` (`status`, `create_time`)',
    'SELECT ''skip: idx_status_created already exists'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验收：
-- SHOW INDEX FROM subscribe_outbox WHERE Key_name = 'idx_status_created';
