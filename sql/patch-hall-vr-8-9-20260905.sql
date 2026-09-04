-- 8/9 号馆 VR 已迁到 720yun 可校验子域，回填链接并改掉「筹备中」简介。
-- 预发库里链接往往已经填过，本文件仍会把简介对齐，避免按钮能进、正文还写筹备。
-- 可重复执行。
--
-- 用法：mysql -u<user> -p <dbname> < sql/patch-hall-vr-8-9-20260905.sql

SET NAMES utf8mb4;

UPDATE `hall` SET
  `intro` = '校园安全常识、应急演练与警示教育，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/c1aje0hm5f2'
WHERE `id` = 8;

UPDATE `hall` SET
  `intro` = '面向山区道路运输场景的典型案例与安全警示教育，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/8a1je0hm5k4'
WHERE `id` = 9;
