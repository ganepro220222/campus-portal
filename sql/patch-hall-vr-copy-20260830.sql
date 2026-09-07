-- 已有库：8/9 号馆简介与按钮文案对齐。
-- VR 入口已摘掉时，简介不要再写「支持 VR 全景漫游」。
-- 仅当 VR 仍不可用、且简介仍声称「支持 VR」时才改写。

SET NAMES utf8mb4;

UPDATE hall
SET intro = '校园安全常识、应急演练与警示教育，VR 全景漫游正在筹备中。'
WHERE id = 8
  AND (vr_url IS NULL OR vr_url LIKE '%bafang720.com%')
  AND intro LIKE '%支持 VR 全景漫游%';

UPDATE hall
SET intro = '面向山区道路运输场景的典型案例与安全警示教育，VR 全景漫游正在筹备中。'
WHERE id = 9
  AND (vr_url IS NULL OR vr_url LIKE '%eqvrar.com%')
  AND intro LIKE '%支持 VR 全景漫游%';

-- 验收：
--   SELECT id, intro, vr_url FROM hall WHERE id IN (8, 9);
--   期望：vr_url 仍为 NULL（或已迁 720yun 则不动），intro 不再写「支持 VR 全景漫游」。
