-- 统一 feedback.type 契约（幂等，可重复执行）
--
-- 修复历史 patch 曾使用英文默认值 other，导致后台中文筛选无法命中。
-- ECS 执行：
--   mysql ... shuyuan < /opt/shuyuan/sql/patch-feedback-type-normalize.sql

SET NAMES utf8mb4;
SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'feedback'
        AND column_name = 'type'
    ),
    'SELECT ''skip: feedback.type exists'' AS migration_note',
    'ALTER TABLE `feedback` ADD COLUMN `type` VARCHAR(30) NOT NULL DEFAULT ''其他'' AFTER `member_id`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `feedback`
SET `type` = CASE
  WHEN LOWER(TRIM(`type`)) = 'other' THEN '其他'
  ELSE TRIM(`type`)
END;

UPDATE `feedback`
SET `type` = '其他'
WHERE `type` IS NULL
   OR `type` = ''
   OR `type` NOT IN ('功能建议', '内容纠错', '使用问题', '其他');

ALTER TABLE `feedback`
  MODIFY COLUMN `type` VARCHAR(30) NOT NULL DEFAULT '其他'
  COMMENT '功能建议/内容纠错/使用问题/其他';
