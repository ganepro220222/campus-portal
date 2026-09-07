-- event_log 看板聚合与个人足迹索引。新库已含；旧库升级时执行，可重复。

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
