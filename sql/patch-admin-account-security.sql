-- 账号安全增强：首次改密标记 + 发布权细分
-- 用法：mysql -uroot -p shuyuan < sql/patch-admin-account-security.sql

SET NAMES utf8mb4;

ALTER TABLE `sys_user`
  ADD COLUMN `must_change_password` TINYINT NOT NULL DEFAULT 0
    COMMENT '是否须下次登录修改密码：1是 0否' AFTER `status`;

-- 发布权与编辑权分离
UPDATE `sys_role` SET `permissions` = '["admin:super","news:read","news:write","news:publish","hall:read","hall:write","hall:publish","course:read","course:write","course:publish","enroll:read","enroll:export","stats:view","category:read","category:write"]'
WHERE `id` = 1;

UPDATE `sys_role` SET `permissions` = '["news:read","news:write","hall:read","hall:write","course:read","course:write","category:read","category:write"]'
WHERE `id` = 2;

INSERT IGNORE INTO `sys_role` (`id`, `role_name`, `permissions`) VALUES
(4, '内容审核', '["news:read","news:publish","hall:read","hall:publish","course:read","course:publish","stats:view"]');

-- 生产环境建议：新建独立超管后执行
-- UPDATE `sys_user` SET `status` = 0 WHERE `username` = 'admin';
