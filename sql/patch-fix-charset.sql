-- 修复 seed-dev 以 latin1 导入导致的 UTF-8 乱码（mojibake）
-- 用法：docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 --default-character-set=utf8mb4 shuyuan < sql/patch-fix-charset.sql

SET NAMES utf8mb4;

-- 辅助：将误存为 latin1 的 UTF-8 字节还原为正确中文
-- 仅处理含非 ASCII 字符的字段，避免误伤纯英文

UPDATE `category` SET `name` = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `news` SET
  `title`   = CONVERT(CAST(CONVERT(`title` USING latin1) AS BINARY) USING utf8mb4),
  `summary` = CONVERT(CAST(CONVERT(`summary` USING latin1) AS BINARY) USING utf8mb4),
  `content` = CONVERT(CAST(CONVERT(`content` USING latin1) AS BINARY) USING utf8mb4)
WHERE `title` REGEXP '[^[:ascii:]]';

UPDATE `hall` SET
  `name`  = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4),
  `intro` = CONVERT(CAST(CONVERT(`intro` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `hall_media` SET `caption` = CONVERT(CAST(CONVERT(`caption` USING latin1) AS BINARY) USING utf8mb4)
WHERE `caption` IS NOT NULL AND `caption` REGEXP '[^[:ascii:]]';

UPDATE `course` SET
  `name`            = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4),
  `intro`           = CONVERT(CAST(CONVERT(`intro` USING latin1) AS BINARY) USING utf8mb4),
  `target_audience` = CONVERT(CAST(CONVERT(`target_audience` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `craft` SET
  `name`     = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4),
  `intro_zh` = CONVERT(CAST(CONVERT(`intro_zh` USING latin1) AS BINARY) USING utf8mb4),
  `intro_en` = CONVERT(CAST(CONVERT(`intro_en` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `resource` SET `name` = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `activity` SET
  `title`    = CONVERT(CAST(CONVERT(`title` USING latin1) AS BINARY) USING utf8mb4),
  `location` = CONVERT(CAST(CONVERT(`location` USING latin1) AS BINARY) USING utf8mb4),
  `intro`    = CONVERT(CAST(CONVERT(`intro` USING latin1) AS BINARY) USING utf8mb4)
WHERE `title` REGEXP '[^[:ascii:]]';

UPDATE `banner` SET
  `title`       = CONVERT(CAST(CONVERT(`title` USING latin1) AS BINARY) USING utf8mb4),
  `description` = CONVERT(CAST(CONVERT(`description` USING latin1) AS BINARY) USING utf8mb4)
WHERE `title` REGEXP '[^[:ascii:]]';

UPDATE `announcement` SET `content` = CONVERT(CAST(CONVERT(`content` USING latin1) AS BINARY) USING utf8mb4)
WHERE `content` REGEXP '[^[:ascii:]]';

UPDATE `member` SET `nickname` = CONVERT(CAST(CONVERT(`nickname` USING latin1) AS BINARY) USING utf8mb4)
WHERE `nickname` REGEXP '[^[:ascii:]]';

UPDATE `member_profile` SET
  `real_name` = CONVERT(CAST(CONVERT(`real_name` USING latin1) AS BINARY) USING utf8mb4),
  `college`   = CONVERT(CAST(CONVERT(`college` USING latin1) AS BINARY) USING utf8mb4)
WHERE `real_name` REGEXP '[^[:ascii:]]';

UPDATE `college_app` SET
  `name`        = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4),
  `description` = CONVERT(CAST(CONVERT(`description` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';

UPDATE `sys_role` SET `role_name` = CONVERT(CAST(CONVERT(`role_name` USING latin1) AS BINARY) USING utf8mb4)
WHERE `role_name` REGEXP '[^[:ascii:]]';

UPDATE `search_index` SET
  `title`   = CONVERT(CAST(CONVERT(`title` USING latin1) AS BINARY) USING utf8mb4),
  `summary` = CONVERT(CAST(CONVERT(`summary` USING latin1) AS BINARY) USING utf8mb4)
WHERE `title` REGEXP '[^[:ascii:]]';

UPDATE `craft_image` SET `angle_label` = CONVERT(CAST(CONVERT(`angle_label` USING latin1) AS BINARY) USING utf8mb4)
WHERE `angle_label` IS NOT NULL AND `angle_label` REGEXP '[^[:ascii:]]';

UPDATE `enroll` SET
  `name`    = CONVERT(CAST(CONVERT(`name` USING latin1) AS BINARY) USING utf8mb4),
  `college` = CONVERT(CAST(CONVERT(`college` USING latin1) AS BINARY) USING utf8mb4)
WHERE `name` REGEXP '[^[:ascii:]]';
