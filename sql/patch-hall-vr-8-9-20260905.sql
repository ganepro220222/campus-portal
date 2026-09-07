-- 8/9 号馆回填已校验的 720 云链接，并改掉「筹备中」简介。可重复执行。

SET NAMES utf8mb4;

UPDATE `hall` SET
  `intro` = '校园安全常识、应急演练与警示教育，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/c1aje0hm5f2'
WHERE `id` = 8;

UPDATE `hall` SET
  `intro` = '面向山区道路运输场景的典型案例与安全警示教育，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/8a1je0hm5k4'
WHERE `id` = 9;
