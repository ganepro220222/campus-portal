-- 历史升级入口：保持可重复执行，并与当前 feedback.type 中文契约一致。
-- 新部署请按 sql-init-manifest.json 执行 patch-feedback-type-normalize.sql。

SET NAMES utf8mb4;
SET @db := DATABASE();

SET @feedback_type_sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'feedback'
        AND column_name = 'type'
    ),
    'SELECT ''skip: feedback.type exists'' AS migration_note',
    'ALTER TABLE `feedback` ADD COLUMN `type` VARCHAR(30) NOT NULL DEFAULT ''其他'' COMMENT ''功能建议/内容纠错/使用问题/其他'' AFTER `member_id`'
  )
);
PREPARE stmt FROM @feedback_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `feedback`
SET `type` = CASE
  WHEN TRIM(`type`) IN ('功能建议', '内容纠错', '使用问题', '其他') THEN TRIM(`type`)
  ELSE '其他'
END
WHERE `type` IS NULL
   OR CAST(`type` AS BINARY) <> CAST(
     CASE
       WHEN TRIM(`type`) IN ('功能建议', '内容纠错', '使用问题', '其他') THEN TRIM(`type`)
       ELSE '其他'
     END AS BINARY
   );

SET @feedback_type_sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'feedback'
        AND column_name = 'type'
        AND data_type = 'varchar'
        AND character_maximum_length = 30
        AND is_nullable = 'NO'
        AND column_default = '其他'
    ),
    'SELECT ''skip: feedback.type definition is current'' AS migration_note',
    'ALTER TABLE `feedback` MODIFY COLUMN `type` VARCHAR(30) NOT NULL DEFAULT ''其他'' COMMENT ''功能建议/内容纠错/使用问题/其他'''
  )
);
PREPARE stmt FROM @feedback_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
