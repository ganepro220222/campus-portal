-- 展馆 VR 主机迁到新微信业务域名租户子域（路径不变）。
-- 旧：a28c11ea.720roma.com / 2e6zb07zn85.720yun.com
-- 新：9c03e1f7.720roma.com / c73zd07zrkz.720yun.com
-- 可重复执行。

UPDATE `hall`
SET `vr_url` = REPLACE(`vr_url`, 'https://a28c11ea.720roma.com', 'https://9c03e1f7.720roma.com')
WHERE `vr_url` LIKE 'https://a28c11ea.720roma.com/%';

UPDATE `hall`
SET `vr_url` = REPLACE(`vr_url`, 'https://2e6zb07zn85.720yun.com', 'https://c73zd07zrkz.720yun.com')
WHERE `vr_url` LIKE 'https://2e6zb07zn85.720yun.com/%';
