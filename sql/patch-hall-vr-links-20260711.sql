-- sql/patch-hall-vr-links-20260711.sql — 补全校园安全教育馆、西部山区安全基地 VR 链接
-- 用法：
--   Get-Content sql\patch-hall-vr-links-20260711.sql -Raw | docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 --default-character-set=utf8mb4 shuyuan
--
-- 说明：校园安全教育馆甲方提供为 http 链接；小程序 web-view 要求 https，故入库使用 https 同路径。

SET NAMES utf8mb4;
USE shuyuan;

UPDATE `hall` SET
  `name` = '校园安全教育馆',
  `intro` = '校园安全常识、应急演练与警示教育，支持 VR 全景漫游。',
  `vr_url` = 'https://www.bafang720.com/tour/4220d0a68856dcb9'
WHERE `id` = 8;

UPDATE `hall` SET
  `intro` = '面向山区道路运输场景的典型案例与安全警示教育，支持 VR 全景漫游。',
  `vr_url` = 'https://eqvrar.com/hcvr/692/?t=1567242165'
WHERE `id` = 9;
