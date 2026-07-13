-- token_version：改密/重置密码后递增，使旧 JWT 立即失效
-- 新库已并入 init.sql；旧库可重复执行本 patch

SET @db := DATABASE();

-- member.token_version
SET @sql_member := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'member' AND column_name = 'token_version'
        ),
        'SELECT ''skip: member.token_version exists'' AS migration_note',
        'ALTER TABLE `member` ADD COLUMN `token_version` INT NOT NULL DEFAULT 0 COMMENT ''JWT 版本号，改密递增'' AFTER `status`'
    )
);
PREPARE stmt FROM @sql_member;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sys_user.token_version
SET @sql_admin := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'sys_user' AND column_name = 'token_version'
        ),
        'SELECT ''skip: sys_user.token_version exists'' AS migration_note',
        'ALTER TABLE `sys_user` ADD COLUMN `token_version` INT NOT NULL DEFAULT 0 COMMENT ''JWT 版本号，改密递增'' AFTER `must_change_password`'
    )
);
PREPARE stmt FROM @sql_admin;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
