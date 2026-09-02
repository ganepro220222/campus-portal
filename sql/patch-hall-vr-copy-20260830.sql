-- sql/patch-hall-vr-copy-20260830.sql — 已有库：8/9 号馆简介与按钮文案对齐
-- 背景：visibility 补丁已摘掉未验收的第三方 VR 入口，但简介仍写「支持 VR 全景漫游」，
--       详情页按钮却是「VR 链接筹备中」，用户看到互相矛盾的信息。
-- 幂等：仅当 VR 仍不可用、且简介仍声称「支持 VR」时才改写。
-- 用法（staging）：
--   docker compose -f docker-compose.staging.yml exec -T mysql \
--     mysql -uroot -p'密码' --default-character-set=utf8mb4 shuyuan \
--     < sql/patch-hall-vr-copy-20260830.sql

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
