-- 文创鉴赏图展示模式（与封面 cover_fit_mode 一致：fill=裁切填满，fit=完整显示）
-- 预留但尚未启用：当前 entity / DTO / 管理端 / 小程序均未读写该列，新库未并入 init.sql。
-- 本文件只保留作历史记录，不在初始化或升级清单中；产品确认逐图 fit 功能前不要执行。
-- 旧库若曾执行，多出的默认 fill 列不影响当前代码。

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
