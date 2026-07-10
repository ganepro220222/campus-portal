-- sql/patch-hall-vr.sql — 展馆 VR 链接与短名称字段（已有库增量升级）
-- 用法：type sql\patch-hall-vr.sql | docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 shuyuan

SET NAMES utf8mb4;
USE shuyuan;

ALTER TABLE `hall`
  ADD COLUMN `short_name` VARCHAR(50) DEFAULT NULL COMMENT '列表短名称' AFTER `name`,
  ADD COLUMN `vr_url` VARCHAR(500) DEFAULT NULL COMMENT '720云VR外链' AFTER `intro`;
