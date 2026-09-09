-- 课程教学视频版本：更换文件后旧播放器不能把旧进度写回新片
-- 幂等：可重复执行。新库 init.sql 已含列时跳过 ADD。

SET @db := DATABASE();

DROP PROCEDURE IF EXISTS __course_video_revision_add_col;
DELIMITER //
CREATE PROCEDURE __course_video_revision_add_col(
    IN tbl_name VARCHAR(64),
    IN col_name VARCHAR(64),
    IN col_def TEXT
)
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = tbl_name AND column_name = col_name
    ) THEN
        SET @ddl := CONCAT('ALTER TABLE `', tbl_name, '` ADD COLUMN ', col_def);
        PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

CALL __course_video_revision_add_col(
    'course',
    'video_revision',
    '`video_revision` BIGINT NOT NULL DEFAULT 1 COMMENT ''教学视频版本，更换文件时递增'' AFTER `video_url`'
);
CALL __course_video_revision_add_col(
    'course_progress',
    'video_revision',
    '`video_revision` BIGINT NOT NULL DEFAULT 1 COMMENT ''进度对应的教学视频版本'' AFTER `course_id`'
);

DROP PROCEDURE IF EXISTS __course_video_revision_add_col;
