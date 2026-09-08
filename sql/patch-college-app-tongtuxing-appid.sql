-- 通途星填入正式 AppID。可重复执行。
-- 只改空值或占位 AppID，不覆盖后台已填的其它值。
-- 没有通途星则补一条。路径留空，由微信打开对方首页。

SET NAMES utf8mb4;

UPDATE `college_app`
SET
  `appid` = 'wx532a624945bc7691',
  `description` = CASE
    WHEN `description` = '关联小程序 · AppID 待配置' THEN '关联小程序'
    ELSE `description`
  END,
  `content_type` = 'jump',
  `path` = CASE
    WHEN `path` IS NULL OR TRIM(`path`) IN ('', 'pages/index/index') THEN ''
    ELSE `path`
  END,
  `status` = 1
WHERE `name` = '通途星'
  AND (`appid` IS NULL OR `appid` = '' OR `appid` LIKE '%PLACEHOLDER%');

INSERT INTO `college_app` (`name`, `description`, `sort`, `status`, `content_type`, `appid`, `path`)
SELECT '通途星', '关联小程序', 1, 1, 'jump', 'wx532a624945bc7691', ''
WHERE NOT EXISTS (SELECT 1 FROM `college_app` WHERE `name` = '通途星');
