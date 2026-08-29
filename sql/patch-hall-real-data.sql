-- sql/patch-hall-real-data.sql — 将占位展馆替换为校方真实 11 馆（已有库执行）
-- 用法：
--   type sql\patch-hall-vr.sql | docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 shuyuan
--   type sql\patch-hall-real-data.sql | docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 shuyuan

SET NAMES utf8mb4;
USE shuyuan;

-- 1) 表结构（幂等，列已存在时会报错可忽略，建议先执行 patch-hall-vr.sql）
-- ALTER TABLE `hall`
--   ADD COLUMN `short_name` VARCHAR(50) DEFAULT NULL COMMENT '列表短名称' AFTER `name`,
--   ADD COLUMN `vr_url` VARCHAR(500) DEFAULT NULL COMMENT '720云VR外链' AFTER `intro`;

-- 2) 展馆分类（更新旧名称 + 补充新分类）
UPDATE `category` SET `name` = '博物馆与校史', `sort` = 1 WHERE `type` = 'hall' AND `id` = 4;
UPDATE `category` SET `name` = '红色教育', `sort` = 2 WHERE `type` = 'hall' AND `id` = 5;
UPDATE `category` SET `name` = '研学服务', `sort` = 3 WHERE `type` = 'hall' AND `id` = 6;
UPDATE `category` SET `name` = '素质教育', `sort` = 4 WHERE `type` = 'hall' AND `id` = 7;
INSERT IGNORE INTO `category` (`id`, `type`, `name`, `sort`, `status`) VALUES
(16, 'hall', '文化艺术', 5, 1),
(17, 'hall', '安全教育', 6, 1),
(18, 'hall', '主题宣教', 7, 1),
(19, 'hall', '待上线', 8, 0);  -- 暂无上线展馆，启用会出现空页签

-- 3) 11 馆数据（按 id 覆盖更新，保留原主键以兼容 home_recommend / favorite 等引用）
UPDATE `hall` SET
  `name` = '贵州交通博物馆·教育馆',
  `short_name` = '交通博物馆',
  `intro` = '贵州交通发展历程与教育成果数字化展陈，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://a28c11ea.720roma.com/vr/515a9635070ca212/',
  `category_id` = 4,
  `sort` = 1,
  `status` = 1
WHERE `id` = 1;

UPDATE `hall` SET
  `name` = '校史馆',
  `short_name` = '校史馆',
  `intro` = '学校办学历程与重要发展节点的线上展陈，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://a28c11ea.720roma.com/vr/b5b7196093f3c25a/',
  `category_id` = 4,
  `sort` = 2,
  `status` = 1
WHERE `id` = 2;

UPDATE `hall` SET
  `name` = '贵州交通红色教育基地',
  `short_name` = '红色教育基地',
  `intro` = '基地实体展陈的线上导览入口，支持 VR 全景漫游与图文介绍。',
  `vr_url` = 'https://a28c11ea.720roma.com/vr/59e140eb05f9e134/',
  `category_id` = 5,
  `sort` = 3,
  `status` = 1
WHERE `id` = 3;

UPDATE `hall` SET
  `name` = '交旅融合研学服务中心',
  `short_name` = '交旅研学',
  `intro` = '交旅融合主题研学服务展示，连接线上云游与线下研学实践。',
  `vr_url` = 'https://a28c11ea.720roma.com/vr/96cb6946cefd5b99/',
  `category_id` = 6,
  `sort` = 4,
  `status` = 1
WHERE `id` = 4;

UPDATE `hall` SET
  `name` = '学生素质发展中心',
  `short_name` = '素质发展中心',
  `intro` = '学生综合素质培养成果与活动空间线上展示。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/374j5dyvrf2',
  `category_id` = 7,
  `sort` = 5,
  `status` = 1
WHERE `id` = 5;

UPDATE `hall` SET
  `name` = '学生科普体验中心',
  `short_name` = '科普体验中心',
  `intro` = '交通科技与学生科普互动体验场景，激发科学探索兴趣。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/7a0j5dyksk9',
  `category_id` = 7,
  `sort` = 6,
  `status` = 1
WHERE `id` = 6;

UPDATE `hall` SET
  `name` = '文化千岛艺术馆',
  `short_name` = '千岛艺术馆',
  `intro` = '汇聚多元文化艺术作品，展现交通院校美育与文创成果。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/660j5dyvsv5',
  `category_id` = 16,
  `sort` = 7,
  `status` = 1
WHERE `id` = 7;

-- 8/9 号馆 VR 暂缺：第三方域名无法完成微信业务域名校验（原链接见 patch-hall-vr-visibility-20260829.sql），
-- 合伙人迁移到 720yun 后再回填；展馆本体保留上线（展馆达人徽章要求 11 馆齐全）。
-- vr_url 带域名防护：已换成 720yun 的不要被本初始化补丁覆盖成 NULL。
UPDATE `hall` SET
  `name` = '校园安全教育馆',
  `short_name` = '校园安全教育馆',
  `intro` = CASE
    WHEN `vr_url` IS NULL OR `vr_url` LIKE '%bafang720.com%'
      THEN '校园安全常识、应急演练与警示教育，VR 全景漫游正在筹备中。'
    ELSE `intro`
  END,
  `vr_url` = CASE
    WHEN `vr_url` IS NULL OR `vr_url` LIKE '%bafang720.com%' THEN NULL
    ELSE `vr_url`
  END,
  `category_id` = 17,
  `sort` = 8,
  `status` = 1
WHERE `id` = 8;

UPDATE `hall` SET
  `name` = '西部山区道路运输安全警示教育基地',
  `short_name` = '西部山区安全基地',
  `intro` = CASE
    WHEN `vr_url` IS NULL OR `vr_url` LIKE '%eqvrar.com%'
      THEN '面向山区道路运输场景的典型案例与安全警示教育，VR 全景漫游正在筹备中。'
    ELSE `intro`
  END,
  `vr_url` = CASE
    WHEN `vr_url` IS NULL OR `vr_url` LIKE '%eqvrar.com%' THEN NULL
    ELSE `vr_url`
  END,
  `category_id` = 17,
  `sort` = 9,
  `status` = 1
WHERE `id` = 9;

UPDATE `hall` SET
  `name` = '节水宣传教育中心',
  `short_name` = '节水宣传中心',
  `intro` = '节水理念、技术与宣传教育成果展示。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/f7bj5pmOkO2',
  `category_id` = 18,
  `sort` = 10,
  `status` = 1
WHERE `id` = 10;

UPDATE `hall` SET
  `name` = '牙舟陶数字展厅',
  `short_name` = '牙舟陶展厅',
  `intro` = '国家级非物质文化遗产牙舟陶数字展陈，汇集百余件 3D 数字化展品，依托 VR 全景漫游赏析器物造型、窑变釉色与民俗纹饰，感受贵州本土陶艺魅力。',
  `vr_url` = 'https://2e6zb07zn85.720yun.com/vr/e96je04kew9',
  `category_id` = 16,
  `sort` = 11,
  `status` = 1
WHERE `id` = 11;

-- 4) 搜索索引同步
UPDATE `search_index` SET `title` = '贵州交通博物馆·教育馆', `summary` = '交通博物馆 VR 展馆' WHERE `target_type` = 'hall' AND `target_id` = 1;
UPDATE `search_index` SET `title` = '校史馆', `summary` = '校史 VR 展馆' WHERE `target_type` = 'hall' AND `target_id` = 2;
UPDATE `search_index` SET `title` = '贵州交通红色教育基地', `summary` = '红色教育 VR 展馆' WHERE `target_type` = 'hall' AND `target_id` = 3;
UPDATE `search_index` SET `title` = '牙舟陶数字展厅', `summary` = '牙舟陶 VR 展馆' WHERE `target_type` = 'hall' AND `target_id` = 11;
