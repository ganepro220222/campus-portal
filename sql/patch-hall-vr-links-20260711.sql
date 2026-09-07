-- 补全校园安全教育馆、西部山区安全基地 VR 链接。
-- 原链接为 http，入库改为 https，以符合小程序 web-view 要求。

SET NAMES utf8mb4;

UPDATE `hall` SET
  `name` = '校园安全教育馆',
  `intro` = '校园安全常识、应急演练与警示教育，支持 VR 全景漫游。',
  `vr_url` = 'https://www.bafang720.com/tour/4220d0a68856dcb9'
WHERE `id` = 8;

UPDATE `hall` SET
  `intro` = '面向山区道路运输场景的典型案例与安全警示教育，支持 VR 全景漫游。',
  `vr_url` = 'https://eqvrar.com/hcvr/692/?t=1567242165'
WHERE `id` = 9;
