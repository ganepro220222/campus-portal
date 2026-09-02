-- Upgrade existing DB: add feedback.type (new installs already have it in init.sql)
ALTER TABLE `feedback`
  ADD COLUMN `type` VARCHAR(30) NOT NULL DEFAULT '其他' AFTER `member_id`;
