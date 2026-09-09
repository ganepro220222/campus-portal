-- 旧库：活动达人文案与「审核通过才计参加」对齐。可重复执行。
UPDATE `badge`
SET `description` = '审核通过 5 次活动'
WHERE `condition_type` = 'enroll_count'
  AND `name` = '活动达人'
  AND `description` <> '审核通过 5 次活动';
