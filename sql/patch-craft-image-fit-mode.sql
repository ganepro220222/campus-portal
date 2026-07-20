-- 文创鉴赏图展示模式（与封面 cover_fit_mode 一致：fill=裁切填满，fit=完整显示）
-- 新库已并入 init.sql；旧库可重复执行（幂等）。

SET @db := DATABASE();

SET @sql := (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns
               WHERE table_schema = @db AND table_name = 'craft_image' AND column_name = 'fit_mode'),
        'SELECT ''skip: craft_image.fit_mode'' AS note',
        'ALTER TABLE `craft_image` ADD COLUMN `fit_mode` VARCHAR(16) NOT NULL DEFAULT ''fill'' COMMENT ''详情轮播展示：fill/fit'' AFTER `angle_label`'
    )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
