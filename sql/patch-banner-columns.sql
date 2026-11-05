-- 开发环境旧库补丁（banner 字段）

ALTER TABLE `banner`
  ADD COLUMN `title` VARCHAR(200) DEFAULT NULL COMMENT '标题' AFTER `id`,
  ADD COLUMN `description` VARCHAR(500) DEFAULT NULL COMMENT '副标题/描述' AFTER `title`,
  MODIFY COLUMN `image_url` VARCHAR(500) DEFAULT NULL COMMENT '图片URL';

-- 测试账号的学号和密码归 seed-dev.sql 管，这里不再改
