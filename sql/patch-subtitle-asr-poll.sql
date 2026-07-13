-- ASR 轮询元数据字段（course 表）
SET @db := DATABASE();

SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'course' AND column_name = 'subtitle_asr_started_at'
        ),
        'SELECT ''skip: subtitle_asr_* exists'' AS migration_note',
        'ALTER TABLE `course`
            ADD COLUMN `subtitle_asr_started_at` DATETIME DEFAULT NULL COMMENT ''ASR任务开始时间'' AFTER `subtitle_task_id`,
            ADD COLUMN `subtitle_asr_last_poll_at` DATETIME DEFAULT NULL COMMENT ''ASR最近轮询时间'' AFTER `subtitle_asr_started_at`,
            ADD COLUMN `subtitle_asr_attempt_count` INT NOT NULL DEFAULT 0 COMMENT ''ASR轮询次数'' AFTER `subtitle_asr_last_poll_at`,
            ADD COLUMN `subtitle_asr_last_error` VARCHAR(500) DEFAULT NULL COMMENT ''ASR最近错误摘要'' AFTER `subtitle_asr_attempt_count`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
