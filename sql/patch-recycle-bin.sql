-- 回收站 / 清退：旧库若缺 is_deleted 则补齐。新库已含，可重复执行。

SET @db := DATABASE();

-- 若个别旧库的内容表缺 is_deleted，则补齐（逐表幂等）
DROP PROCEDURE IF EXISTS __ensure_is_deleted;
DELIMITER //
CREATE PROCEDURE __ensure_is_deleted(IN tbl VARCHAR(64))
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = 'is_deleted'
    ) THEN
        SET @ddl := CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `is_deleted` TINYINT NOT NULL DEFAULT 0');
        PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

CALL __ensure_is_deleted('news');
CALL __ensure_is_deleted('hall');
CALL __ensure_is_deleted('craft');
CALL __ensure_is_deleted('course');
CALL __ensure_is_deleted('resource');
CALL __ensure_is_deleted('activity');

DROP PROCEDURE IF EXISTS __ensure_is_deleted;

-- 自检：各内容表当前回收站（已软删）数量
SELECT 'news'     AS type, COUNT(*) AS deleted_count FROM news     WHERE is_deleted = 1
UNION ALL SELECT 'hall',     COUNT(*) FROM hall     WHERE is_deleted = 1
UNION ALL SELECT 'craft',    COUNT(*) FROM craft    WHERE is_deleted = 1
UNION ALL SELECT 'course',   COUNT(*) FROM course   WHERE is_deleted = 1
UNION ALL SELECT 'resource', COUNT(*) FROM resource WHERE is_deleted = 1
UNION ALL SELECT 'activity', COUNT(*) FROM activity WHERE is_deleted = 1;
