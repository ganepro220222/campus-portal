-- sql/patch-hall-vr-visibility-20260829.sql — 已有库（staging/prod）数据修正
-- 背景：
--   1)「待上线」分类（id=19）处于启用状态但名下没有任何上线展馆，
--      小程序展馆页会出现一个点进去永远为空的页签；
--   2) 8/9 号馆 VR 链接指向第三方域名 bafang720.com / eqvrar.com，这两个域名
--      无法上传微信业务域名校验文件，体验版/正式版 web-view 打开即报“不支持打开该页面”。
--      合伙人计划将两馆全景迁移到 720yun，迁移完成前先摘掉 VR 入口。
--      注意：只清 vr_url、不下线展馆——「展馆达人」徽章要求参观全部 11 个展馆，
--      小程序端 vr_url 为空时会显示既有的「VR 链接筹备中」状态，展馆内容仍可浏览。
-- 幂等，可重复执行。
-- 用法（staging）：
--   docker compose -f docker-compose.staging.yml exec -T mysql \
--     mysql -uroot -p'密码' --default-character-set=utf8mb4 shuyuan \
--     < sql/patch-hall-vr-visibility-20260829.sql

SET NAMES utf8mb4;
USE shuyuan;

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
