-- sql/patch-college-app-demo.sql
-- 旧库升级：首页「关联应用」的 college_app 仍可能是 11 条旧学院名。
-- seed-dev.sql 用 INSERT IGNORE，不会覆盖已有行；本 patch 收敛为通途星 + 2 条示例。
-- 可重复执行（先清空再写入固定 id 1–3）。
--
-- 用法：mysql -uroot -pdev123456 shuyuan < sql/patch-college-app-demo.sql

SET NAMES utf8mb4;

DELETE FROM `college_app`;

INSERT INTO `college_app` (`id`, `name`, `description`, `sort`, `status`, `content_type`, `appid`, `path`) VALUES
(1, '通途星',         '关联小程序 · AppID 待配置',   1, 1, 'jump',   'wxPLACEHOLDER001', 'pages/index/index'),
(2, '示例关联应用 A', '示例条目 · 用于演示列表布局', 2, 1, 'manual', NULL, NULL),
(3, '示例关联应用 B', '示例条目 · 用于演示跳转形态', 3, 1, 'jump',   'wxPLACEHOLDER002', 'pages/index/index');
