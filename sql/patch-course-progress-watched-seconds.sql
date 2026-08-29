-- 课程进度：累计有效观看秒数 + 上次上报位置（完成判定与续播分离）
-- 幂等：可重复执行。新库 init.sql 已含列时跳过 ADD，回填仅处理 watched_seconds=0 的旧记录。

SET @db := DATABASE();

DROP PROCEDURE IF EXISTS __course_progress_add_col;
DELIMITER //
CREATE PROCEDURE __course_progress_add_col(IN col_name VARCHAR(64), IN col_def TEXT)
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'course_progress' AND column_name = col_name
    ) THEN
        SET @ddl := CONCAT('ALTER TABLE `course_progress` ADD COLUMN ', col_def);
        PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

CALL __course_progress_add_col(
    'watched_seconds',
    '`watched_seconds` INT NOT NULL DEFAULT 0 COMMENT ''累计有效观看秒数'' AFTER `completed`'
);
CALL __course_progress_add_col(
    'last_report_position_seconds',
    '`last_report_position_seconds` INT NOT NULL DEFAULT 0 COMMENT ''上次上报播放位置（秒）'' AFTER `watched_seconds`'
);

-- 旧库：同步上次上报位置（与历史最大位置对齐）
UPDATE `course_progress`
SET `last_report_position_seconds` = `last_position_seconds`
WHERE `last_report_position_seconds` = 0
  AND `last_position_seconds` > 0;

-- 旧库：高进度未完成记录回填可信观看量，避免升级后永久卡死
UPDATE `course_progress` cp
LEFT JOIN `course` c ON c.id = cp.course_id
SET cp.`watched_seconds` = LEAST(
        cp.`last_position_seconds`,
        LEAST(
            COALESCE(NULLIF(c.`duration_minutes`, 0) * 60, cp.`total_duration_seconds`),
            GREATEST(
                LEAST(120, COALESCE(NULLIF(c.`duration_minutes`, 0) * 60, cp.`total_duration_seconds`)),
                FLOOR(COALESCE(NULLIF(c.`duration_minutes`, 0) * 60, cp.`total_duration_seconds`) * 0.15)
            )
        )
    )
WHERE cp.`completed` = 0
  AND cp.`watched_seconds` = 0
  AND cp.`progress_percent` >= 90.00
  AND cp.`last_position_seconds` > 0;

DROP PROCEDURE IF EXISTS __course_progress_add_col;
