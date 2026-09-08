-- 旧库升级：关联小程序收敛为通途星。可重复执行。
-- 会清空整张表。后台已手工维护过的请先导出。

SET NAMES utf8mb4;

DELETE FROM `college_app`;

INSERT INTO `college_app` (`id`, `name`, `description`, `sort`, `status`, `content_type`, `appid`, `path`) VALUES
(1, '通途星', '关联小程序', 1, 1, 'jump', 'wx532a624945bc7691', '');
