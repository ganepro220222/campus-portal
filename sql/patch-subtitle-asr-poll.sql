-- ASR 轮询元数据字段（course 表）
-- 新库已并入 init.sql；旧库可重复执行本 patch（逐列幂等）
SET @db := DATABASE();

-- subtitle_asr_started_at
SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'course' AND column_name = 'subtitle_asr_started_at'
        ),
        'SELECT ''skip: subtitle_asr_started_at exists'' AS migration_note',
        'ALTER TABLE `course` ADD COLUMN `subtitle_asr_started_at` DATETIME DEFAULT NULL COMMENT ''ASR任务开始时间'' AFTER `subtitle_task_id`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- subtitle_asr_last_poll_at
SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'course' AND column_name = 'subtitle_asr_last_poll_at'
        ),
        'SELECT ''skip: subtitle_asr_last_poll_at exists'' AS migration_note',
        'ALTER TABLE `course` ADD COLUMN `subtitle_asr_last_poll_at` DATETIME DEFAULT NULL COMMENT ''ASR最近轮询时间'' AFTER `subtitle_asr_started_at`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- subtitle_asr_attempt_count
SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'course' AND column_name = 'subtitle_asr_attempt_count'
        ),
        'SELECT ''skip: subtitle_asr_attempt_count exists'' AS migration_note',
        'ALTER TABLE `course` ADD COLUMN `subtitle_asr_attempt_count` INT NOT NULL DEFAULT 0 COMMENT ''ASR轮询次数'' AFTER `subtitle_asr_last_poll_at`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- subtitle_asr_last_error
SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'course' AND column_name = 'subtitle_asr_last_error'
        ),
        'SELECT ''skip: subtitle_asr_last_error exists'' AS migration_note',
        'ALTER TABLE `course` ADD COLUMN `subtitle_asr_last_error` VARCHAR(500) DEFAULT NULL COMMENT ''ASR最近错误摘要'' AFTER `subtitle_asr_attempt_count`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验收：应返回 4 行
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name = 'course'
--   AND column_name IN (
--     'subtitle_asr_started_at',
--     'subtitle_asr_last_poll_at',
--     'subtitle_asr_attempt_count',
--     'subtitle_asr_last_error'
--   );
