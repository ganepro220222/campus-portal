-- 展馆增加短名称与 VR 链接字段（已有库升级）。

SET NAMES utf8mb4;

ALTER TABLE `hall`
  ADD COLUMN `short_name` VARCHAR(50) DEFAULT NULL COMMENT '列表短名称' AFTER `name`,
  ADD COLUMN `vr_url` VARCHAR(500) DEFAULT NULL COMMENT '720云VR外链' AFTER `intro`;
