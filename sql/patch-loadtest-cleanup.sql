-- 清理压测专用数据（activity_id=99 + loadtest001–050 账号）
-- 用法（staging ECS）：
--   cd /opt/shuyuan
--   DB_USERNAME=... DB_PASSWORD=... 见 .env
--   docker compose -f docker-compose.staging.yml exec -T mysql \
--     mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" shuyuan < sql/patch-loadtest-cleanup.sql
--
-- 可重复执行（无对应行时不报错）。
--
-- 【生产库护栏】本脚本按 id 区间删数据：member_id 101–150、activity_id 99。
-- 这些 id 在压测库里是压测账号，在生产库里就是 50 个真实师生和一场真实活动。
-- 所以动手前先核对身份：区间内的 member 必须全部是 loadtest_ 开头的 openid，
-- activity 99 必须是那场压测活动。对不上就中止，一行都不删。
--
-- 护栏用存储过程实现：SIGNAL 只能在存储程序里用。执行账号需要 CREATE ROUTINE 权限；
-- 没有权限时脚本停在 CREATE PROCEDURE，同样是「什么都没删」的安全失败。

USE shuyuan;

-- 压测学员 member_id 101–150（与 patch-loadtest.sql 一致）
SET @loadtest_min := 101;
SET @loadtest_max := 150;

DROP PROCEDURE IF EXISTS _assert_loadtest_range;
DELIMITER $$
CREATE PROCEDURE _assert_loadtest_range(IN id_min BIGINT, IN id_max BIGINT)
BEGIN
  DECLARE foreign_members INT DEFAULT 0;
  DECLARE wrong_activity INT DEFAULT 0;

  -- 区间内任何一个不像压测账号的 member，都说明这不是压测库
  SELECT COUNT(1) INTO foreign_members
  FROM `member`
  WHERE `id` BETWEEN id_min AND id_max
    AND `openid` NOT REGEXP '^loadtest_[0-9]+$';

  IF foreign_members > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = '中止：member 101-150 区间内存在非压测账号，这可能是生产库。请人工核对后再处理。';
  END IF;

  -- activity 99 若存在，必须是压测活动本身
  SELECT COUNT(1) INTO wrong_activity
  FROM `activity`
  WHERE `id` = 99 AND `title` <> '【压测】并发报名专项活动';

  IF wrong_activity > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = '中止：activity 99 不是压测活动，删掉会毁掉一场真实活动。';
  END IF;
END$$
DELIMITER ;

CALL _assert_loadtest_range(@loadtest_min, @loadtest_max);
DROP PROCEDURE _assert_loadtest_range;

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
