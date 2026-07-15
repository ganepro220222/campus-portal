-- 工艺品三维沉浸式鉴赏 MVP 字段（复用 model_3d_url，不新增 model_url）
-- 新库已并入 init.sql；旧库可重复执行（幂等）。

SET @db := DATABASE();

-- poster_url
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'poster_url'),
        'SELECT ''skip: craft.poster_url'' AS note',
        'ALTER TABLE `craft` ADD COLUMN `poster_url` VARCHAR(500) DEFAULT NULL COMMENT ''3D加载期封面图'' AFTER `model_3d_url`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- transform_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'transform_json'),
        'SELECT ''skip: craft.transform_json'' AS note',
        'ALTER TABLE `craft` ADD COLUMN `transform_json` JSON DEFAULT NULL COMMENT ''归一化 scale/offset'' AFTER `poster_url`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- material_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'material_json'),
        'SELECT ''skip: craft.material_json'' AS note',
        'ALTER TABLE `craft` ADD COLUMN `material_json` JSON DEFAULT NULL COMMENT ''PBR材质参数'' AFTER `transform_json`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- camera_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'camera_json'),
        'SELECT ''skip: craft.camera_json'' AS note',
        'ALTER TABLE `craft` ADD COLUMN `camera_json` JSON DEFAULT NULL COMMENT ''初始机位'' AFTER `material_json`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- viewer_enabled
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'viewer_enabled'),
        'SELECT ''skip: craft.viewer_enabled'' AS note',
        'ALTER TABLE `craft` ADD COLUMN `viewer_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''是否开启沉浸式鉴赏'' AFTER `camera_json`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
