-- 封面展示模式：fill=裁切填满（默认） fit=完整显示
ALTER TABLE `news` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '封面展示：fill/fit' AFTER `cover`;
ALTER TABLE `course` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '封面展示：fill/fit' AFTER `cover`;
ALTER TABLE `hall` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '封面展示：fill/fit' AFTER `cover`;
ALTER TABLE `craft` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '封面展示：fill/fit' AFTER `cover`;
ALTER TABLE `activity` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '封面展示：fill/fit' AFTER `cover`;
ALTER TABLE `banner` ADD COLUMN `cover_fit_mode` VARCHAR(16) NOT NULL DEFAULT 'fill' COMMENT '轮播图展示：fill/fit' AFTER `image_url`;
