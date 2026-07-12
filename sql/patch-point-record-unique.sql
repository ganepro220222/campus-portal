-- =============================================================================
-- point_record 唯一索引（仅对「未包含该索引」的旧库执行一次）
-- 新库请使用 init.sql，勿重复执行本 patch。
-- =============================================================================
-- 执行顺序：
--   1. patch-point-record-unique-cleanup.sql 中 Step 1 查重
--   2. 若有重复 → Step 2 审计 → Step 3 清理（Step 4 积分扣回须人工确认）
--   3. 再执行本文件
-- =============================================================================

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'point_record'
      AND index_name = 'uk_member_action_remark'
);

SET @ddl := IF(
    @idx_exists = 0,
    'ALTER TABLE `point_record` ADD UNIQUE KEY `uk_member_action_remark` (`member_id`, `action`, `remark`)',
    'SELECT ''skip: uk_member_action_remark already exists'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
