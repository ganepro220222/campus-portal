-- 账号安全增强：首次改密标记 + 发布权细分
-- 注：must_change_password 与角色 4 已并入 init.sql；旧库升级时执行
-- 用法：mysql -uroot -p shuyuan < sql/patch-admin-account-security.sql
-- 可重复执行：ADD COLUMN 与角色 INSERT 已做幂等处理

SET NAMES utf8mb4;

-- 幂等补列（列已存在则跳过）
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'sys_user'
      AND column_name = 'must_change_password'
);

SET @ddl := IF(
    @col_exists = 0,
    'ALTER TABLE `sys_user` ADD COLUMN `must_change_password` TINYINT NOT NULL DEFAULT 0 COMMENT ''是否须下次登录修改密码：1是 0否'' AFTER `status`',
    'SELECT ''skip: must_change_password already exists'' AS migration_note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 发布权与编辑权分离
UPDATE `sys_role` SET `permissions` = '["admin:super","news:read","news:write","news:publish","hall:read","hall:write","hall:publish","course:read","course:write","course:publish","enroll:read","enroll:export","stats:view","category:read","category:write"]'
WHERE `id` = 1;

UPDATE `sys_role` SET `permissions` = '["news:read","news:write","hall:read","hall:write","course:read","course:write","category:read","category:write"]'
WHERE `id` = 2;

INSERT IGNORE INTO `sys_role` (`id`, `role_name`, `permissions`) VALUES
(4, '内容审核', '["news:read","news:publish","hall:read","hall:publish","course:read","course:publish","stats:view"]');

-- 生产环境建议：新建独立超管后执行
-- UPDATE `sys_user` SET `status` = 0 WHERE `username` = 'admin';

-- 默认超管首次登录须改密（与 init.sql 对齐；可重复执行）
UPDATE `sys_user` SET `must_change_password` = 1
WHERE `username` = 'admin' AND (`must_change_password` IS NULL OR `must_change_password` = 0);
