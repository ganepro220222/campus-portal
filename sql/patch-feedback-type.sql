-- Upgrade existing DB: add feedback.type (new installs already have it in init.sql)
ALTER TABLE `feedback`
  ADD COLUMN `type` VARCHAR(30) NOT NULL DEFAULT 'other' AFTER `member_id`;
