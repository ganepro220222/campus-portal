-- 清理压测专用数据（activity_id=99 + loadtest001–050 账号）
-- 用法（staging ECS）：
--   cd /opt/shuyuan
--   DB_USERNAME=... DB_PASSWORD=... 见 .env
--   docker compose -f docker-compose.staging.yml exec -T mysql \
--     mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" shuyuan < sql/patch-loadtest-cleanup.sql
--
-- 可重复执行（无对应行时不报错）。

USE shuyuan;

-- 压测学员 member_id 101–150（与 patch-loadtest.sql 一致）
SET @loadtest_min := 101;
SET @loadtest_max := 150;

-- 1) 报名（含 activity 99）
DELETE FROM `enroll` WHERE `activity_id` = 99;
DELETE FROM `enroll` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;

-- 2) 互动 / 行为（压测账号通常只有 enroll，其余防御性清理）
DELETE FROM `favorite` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `like_record` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `download_record` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `course_progress` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `point_record` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `member_badge` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `event_log` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `member_subscribe_record` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `subscribe_outbox` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `feedback` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;
DELETE FROM `message` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;

DELETE FROM `ai_message`
WHERE `session_id` IN (
  SELECT `id` FROM (
    SELECT `id` FROM `ai_session` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max
  ) AS _s
);
DELETE FROM `ai_session` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;

-- 3) 压测活动
DELETE FROM `activity` WHERE `id` = 99;

-- 4) 账号（学号 loadtest001–loadtest050）
DELETE FROM `member_account`
WHERE `student_no` REGEXP '^loadtest[0-9]{3}$'
   OR `member_id` BETWEEN @loadtest_min AND @loadtest_max;

DELETE FROM `member_profile` WHERE `member_id` BETWEEN @loadtest_min AND @loadtest_max;

DELETE FROM `member`
WHERE `id` BETWEEN @loadtest_min AND @loadtest_max
   OR `openid` REGEXP '^loadtest_[0-9]+$';
