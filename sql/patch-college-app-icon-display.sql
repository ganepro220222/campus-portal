-- 关联小程序图标：裁切方式与外形。已并入 init.sql；仅旧库升级时执行。
-- fill=裁切填满 fit=完整显示（默认，与加字段前的 aspectFit 一致）
-- square=圆角方 circle=圆形

SET @db := DATABASE();

SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'college_app' AND column_name = 'icon_fit_mode'),
        'SELECT ''skip: college_app.icon_fit_mode'' AS note',
        'ALTER TABLE `college_app` ADD COLUMN `icon_fit_mode` VARCHAR(16) NOT NULL DEFAULT ''fit'' COMMENT ''图标展示：fill/fit'' AFTER `icon_url`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'college_app' AND column_name = 'icon_shape'),
        'SELECT ''skip: college_app.icon_shape'' AS note',
        'ALTER TABLE `college_app` ADD COLUMN `icon_shape` VARCHAR(16) NOT NULL DEFAULT ''square'' COMMENT ''图标外形：square/circle'' AFTER `icon_fit_mode`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
