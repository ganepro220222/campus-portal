-- 移除文创动态 3D 废弃字段（小程序/后台已不再使用；VR 展馆走静态 H5 展包）
-- 旧库可重复执行（幂等）：列不存在则跳过。
-- 注意：DROP 后 model_3d_url 等历史数据不可恢复，执行前请确认无业务依赖。

SET @db := DATABASE();

-- viewer_enabled
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'viewer_enabled'),
        'ALTER TABLE `craft` DROP COLUMN `viewer_enabled`',
        'SELECT ''skip: craft.viewer_enabled'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- camera_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'camera_json'),
        'ALTER TABLE `craft` DROP COLUMN `camera_json`',
        'SELECT ''skip: craft.camera_json'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- material_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'material_json'),
        'ALTER TABLE `craft` DROP COLUMN `material_json`',
        'SELECT ''skip: craft.material_json'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- transform_json
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'transform_json'),
        'ALTER TABLE `craft` DROP COLUMN `transform_json`',
        'SELECT ''skip: craft.transform_json'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- poster_url
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'poster_url'),
        'ALTER TABLE `craft` DROP COLUMN `poster_url`',
        'SELECT ''skip: craft.poster_url'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- model_3d_url
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'model_3d_url'),
        'ALTER TABLE `craft` DROP COLUMN `model_3d_url`',
        'SELECT ''skip: craft.model_3d_url'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- preview_type（文创固定多角度图片，不再区分展示方式）
SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft' AND column_name = 'preview_type'),
        'ALTER TABLE `craft` DROP COLUMN `preview_type`',
        'SELECT ''skip: craft.preview_type'' AS note'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
