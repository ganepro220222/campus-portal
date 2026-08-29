-- 课程进度：累计有效观看秒数（完成判定不再误用 updated_at）
ALTER TABLE `course_progress`
  ADD COLUMN `watched_seconds` INT NOT NULL DEFAULT 0 COMMENT '累计有效观看秒数' AFTER `completed`;
