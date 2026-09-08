-- 删除两条演示用关联小程序。可重复执行。
-- 只按固定名称 + 占位/空 AppID 删除，不碰后台后来新增的真实条目。

SET NAMES utf8mb4;

DELETE FROM `college_app`
WHERE `name` = '示例关联应用 A'
  AND `content_type` = 'manual'
  AND (`appid` IS NULL OR `appid` = '');

DELETE FROM `college_app`
WHERE `name` = '示例关联应用 B'
  AND (`appid` IS NULL OR `appid` = '' OR `appid` LIKE '%PLACEHOLDER%');
