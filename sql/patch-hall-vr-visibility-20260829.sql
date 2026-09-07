-- 已有库数据修正：关掉空的「待上线」分类；
-- 8/9 号馆原 VR 域名无法通过微信业务域名校验，先清空 vr_url，展馆仍上线。
-- 可重复执行。

SET NAMES utf8mb4;

-- 1) 条件关闭空「待上线」页签：仅当该分类下没有任何上线展馆时才停用，
--    避免误隐藏运维人员后来真实放入该分类的内容
UPDATE category c
SET c.status = 0
WHERE c.id = 19
  AND c.type = 'hall'
  AND NOT EXISTS (
    SELECT 1 FROM hall h WHERE h.category_id = c.id AND h.status = 1
  );

-- 2) 8/9 号馆 VR 入口暂时下线（带域名匹配防护：若链接已被人工换成 720yun 则不动）
--    原链接备查，迁移完成后回填：
--    8: https://www.bafang720.com/tour/4220d0a68856dcb9
--    9: https://eqvrar.com/hcvr/692/?t=1567242165
UPDATE hall SET vr_url = NULL WHERE id = 8 AND vr_url LIKE '%bafang720.com%';
UPDATE hall SET vr_url = NULL WHERE id = 9 AND vr_url LIKE '%eqvrar.com%';

-- 验收：
--   SELECT id, name, status FROM category WHERE id = 19;            -- 期望 status=0（该分类为空时）
--   SELECT id, name, vr_url FROM hall WHERE id IN (8, 9);           -- 期望 vr_url 为 NULL
