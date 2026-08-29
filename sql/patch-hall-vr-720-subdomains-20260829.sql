-- 720云 微信小程序业务域名校验专用子域 + 第 11 馆上线（2026-08-29）
-- roma.720yun.com → a28c11ea.720roma.com
-- www.720yun.com  → 2e6zb07zn85.720yun.com
-- 8、9 号馆待合伙人重做迁 720 后再更新
--
-- ECS 执行:
--   mysql ... shuyuan < /opt/shuyuan/sql/patch-hall-vr-720-subdomains-20260829.sql

SET NAMES utf8mb4;
USE shuyuan;

UPDATE hall SET vr_url = 'https://a28c11ea.720roma.com/vr/515a9635070ca212/' WHERE id = 1;
UPDATE hall SET vr_url = 'https://a28c11ea.720roma.com/vr/b5b7196093f3c25a/' WHERE id = 2;
UPDATE hall SET vr_url = 'https://a28c11ea.720roma.com/vr/59e140eb05f9e134/' WHERE id = 3;
UPDATE hall SET vr_url = 'https://a28c11ea.720roma.com/vr/96cb6946cefd5b99/' WHERE id = 4;
UPDATE hall SET vr_url = 'https://2e6zb07zn85.720yun.com/vr/374j5dyvrf2' WHERE id = 5;
UPDATE hall SET vr_url = 'https://2e6zb07zn85.720yun.com/vr/7a0j5dyksk9' WHERE id = 6;
UPDATE hall SET vr_url = 'https://2e6zb07zn85.720yun.com/vr/660j5dyvsv5' WHERE id = 7;
UPDATE hall SET vr_url = 'https://2e6zb07zn85.720yun.com/vr/f7bj5pmOkO2' WHERE id = 10;

UPDATE hall SET
  name = '牙舟陶数字展厅',
  short_name = '牙舟陶展厅',
  intro = '国家级非物质文化遗产牙舟陶数字展陈，汇集百余件 3D 数字化展品，依托 VR 全景漫游赏析器物造型、窑变釉色与民俗纹饰，感受贵州本土陶艺魅力。',
  vr_url = 'https://2e6zb07zn85.720yun.com/vr/e96je04kew9',
  category_id = 16,
  sort = 11,
  status = 1
WHERE id = 11;

INSERT INTO search_index (target_type, target_id, title, summary, status)
SELECT 'hall', 11, '牙舟陶数字展厅', '牙舟陶 VR 展馆', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM search_index WHERE target_type = 'hall' AND target_id = 11
);

UPDATE search_index
SET title = '牙舟陶数字展厅', summary = '牙舟陶 VR 展馆', status = 1
WHERE target_type = 'hall' AND target_id = 11;
