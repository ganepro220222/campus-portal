-- 开发环境旧库补丁（banner 字段 + 测试账号密码）
USE shuyuan;

ALTER TABLE `banner`
  ADD COLUMN `title` VARCHAR(200) DEFAULT NULL COMMENT '标题' AFTER `id`,
  ADD COLUMN `description` VARCHAR(500) DEFAULT NULL COMMENT '副标题/描述' AFTER `title`,
  MODIFY COLUMN `image_url` VARCHAR(500) DEFAULT NULL COMMENT '图片URL';

UPDATE `member_account`
SET `password_hash` = '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm'
WHERE `student_no` = '2021001';
