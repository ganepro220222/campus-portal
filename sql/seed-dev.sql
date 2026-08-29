-- sql/seed-dev.sql — 开发环境演示数据（在 init.sql 之后执行）
-- 用法：mysql -uroot -pdev123456 shuyuan < sql/seed-dev.sql

SET NAMES utf8mb4;

USE shuyuan;

-- 测试学员（学号 2021001，密码 Admin@123，与后台超管相同 BCrypt）
INSERT IGNORE INTO `member` (`id`, `openid`, `nickname`, `points`, `status`) VALUES
(1, 'acct:2021001', '测试学员', 28, 1);

-- 超管密码同步为 Admin@123（与 init.sql 旧哈希不一致时用 UPDATE 修正）
UPDATE `sys_user` SET `password_hash` = '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm',
  `must_change_password` = 1
WHERE `username` = 'admin';

UPDATE `sys_role` SET `role_name` = '超级管理员',
  `permissions` = '["admin:super","news:read","news:write","news:publish","hall:read","hall:write","hall:publish","course:read","course:write","course:publish","enroll:read","enroll:export","stats:view","category:read","category:write"]'
WHERE `id` = 1;

UPDATE `sys_role` SET `role_name` = '内容编辑',
  `permissions` = '["news:read","news:write","hall:read","hall:write","course:read","course:write","category:read","category:write"]'
WHERE `id` = 2;

UPDATE `sys_role` SET `role_name` = '活动管理员',
  `permissions` = '["enroll:read","enroll:export"]'
WHERE `id` = 3;

UPDATE `sys_role` SET `role_name` = '内容审核',
  `permissions` = '["news:read","news:publish","hall:read","hall:publish","course:read","course:publish","stats:view"]'
WHERE `id` = 4;

INSERT IGNORE INTO `member_profile` (`member_id`, `real_name`, `college`, `phone`) VALUES
(1, '测试学员', '中华文化书院', '13800001234')
ON DUPLICATE KEY UPDATE `phone` = VALUES(`phone`), `real_name` = VALUES(`real_name`);

INSERT IGNORE INTO `member_account` (`member_id`, `student_no`, `username`, `password_hash`, `status`) VALUES
(1, '2021001', '2021001', '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm', 1);

-- 分类
INSERT IGNORE INTO `category` (`id`, `type`, `name`, `sort`, `status`) VALUES
(1,  'news',   '书院动态', 1, 1),
(2,  'news',   '活动通知', 2, 1),
(3,  'news',   '专题学习', 3, 1),
(4,  'hall',   '博物馆与校史', 1, 1),
(5,  'hall',   '红色教育', 2, 1),
(6,  'hall',   '研学服务', 3, 1),
(7,  'hall',   '素质教育', 4, 1),
(16, 'hall',   '文化艺术', 5, 1),
(17, 'hall',   '安全教育', 6, 1),
(18, 'hall',   '主题宣教', 7, 1),
(19, 'hall',   '待上线', 8, 0),  -- 该分类暂无上线展馆，启用会出现空页签；有内容后再置 1
(8,  'course', '职业素养', 1, 1),
(9,  'course', '通识必修', 2, 1),
(10, 'course', '专题学习', 3, 1),
(11, 'course', '美育素养', 4, 1),
(12, 'craft',   '手工技艺', 1, 1),
(13, 'craft',   '书画艺术', 2, 1),
(14, 'resource','学习资料', 1, 1),
(15, 'resource','阅读材料', 2, 1);

-- Banner
INSERT IGNORE INTO `banner` (`id`, `title`, `description`, `image_url`, `link_type`, `link_value`, `sort`, `status`) VALUES
(1, '示例：春季学期选课通道开放', '选课时间、操作指引与常见问题说明', NULL, 'news', '1', 1, 1),
(2, '示例：线上展馆新增语音讲解', '六座展馆支持 VR 漫游与语音导览', NULL, 'fixed', 'hall', 2, 1),
(3, '示例：职业素养系列课程上线', '沟通表达、数字素养与安全基础', NULL, 'fixed', 'course', 3, 1);

-- 公告
INSERT IGNORE INTO `announcement` (`id`, `content`, `sort`, `status`, `start_time`, `end_time`) VALUES
(1, '云端书院小程序上线试运行，欢迎师生浏览体验', 1, 1, '2026-01-01 00:00:00', '2027-12-31 23:59:59');

-- 新闻
INSERT IGNORE INTO `news` (`id`, `title`, `summary`, `content`, `category_id`, `status`, `view_count`, `publish_time`) VALUES
(1, '示例：云端书院小程序上线试运行',
 '示例内容。平台面向师生开放，展馆、课程、资源、活动四个模块均可正常使用。',
 '示例内容，仅用于演示列表与详情页排版，正式内容请在管理后台发布。\n\n本次上线包含线上展馆 VR 导览、课程学习与进度记录、学习资源下载、活动在线报名四项功能；个人中心可查看学习足迹、收藏与报名凭证。',
 1, 'published', 1234, '2026-06-05 10:00:00'),
(2, '示例：线上展馆新增语音讲解',
 '示例内容。部分展馆已支持语音导览。',
 '示例内容。进入展馆详情页后可直接跳转 VR 全景，配合图文与语音讲解浏览。',
 2, 'published', 980, '2026-06-03 09:00:00'),
(3, '示例：课程中心支持自动字幕',
 '示例内容。部分课程可在播放页开启字幕。',
 '示例内容。字幕由后台生成后随课程一同下发，播放页可切换开关。',
 3, 'published', 1500, '2026-06-01 14:00:00'),
(4, '示例：职业素养系列课程开放选学',
 '示例内容。课程已开放选学。',
 '示例内容。系列课程围绕沟通表达、数字素养与安全基础展开，支持进度续播。',
 1, 'published', 860, '2026-05-28 08:00:00'),
(5, '示例：学习资源下载专区上线',
 '示例内容。常用资料已归类整理。',
 '示例内容。资源支持在线预览与下载，下载记录可在个人中心查看。',
 3, 'published', 742, '2026-05-25 10:00:00'),
(6, '示例：关于完善个人资料的提示',
 '示例内容。建议补全姓名与联系方式。',
 '示例内容。资料完善后，活动报名与通知送达会更顺畅。',
 2, 'published', 655, '2026-05-20 09:00:00');

-- 展馆（11 馆 — 校方 VR 展馆清单）
INSERT IGNORE INTO `hall` (`id`, `name`, `short_name`, `intro`, `vr_url`, `category_id`, `sort`, `status`) VALUES
(1,  '贵州交通博物馆·教育馆', '交通博物馆', '贵州交通发展历程与教育成果数字化展陈，支持 VR 全景漫游与图文介绍。', 'https://a28c11ea.720roma.com/vr/515a9635070ca212/', 4, 1, 1),
(2,  '校史馆', '校史馆', '学校办学历程与重要发展节点的线上展陈，支持 VR 全景漫游与图文介绍。', 'https://a28c11ea.720roma.com/vr/b5b7196093f3c25a/', 4, 2, 1),
(3,  '贵州交通红色教育基地', '红色教育基地', '基地实体展陈的线上导览入口，支持 VR 全景漫游与图文介绍。', 'https://a28c11ea.720roma.com/vr/59e140eb05f9e134/', 5, 3, 1),
(4,  '交旅融合研学服务中心', '交旅研学', '交旅融合主题研学服务展示，连接线上云游与线下研学实践。', 'https://a28c11ea.720roma.com/vr/96cb6946cefd5b99/', 6, 4, 1),
(5,  '学生素质发展中心', '素质发展中心', '学生综合素质培养成果与活动空间线上展示。', 'https://2e6zb07zn85.720yun.com/vr/374j5dyvrf2', 7, 5, 1),
(6,  '学生科普体验中心', '科普体验中心', '交通科技与学生科普互动体验场景，激发科学探索兴趣。', 'https://2e6zb07zn85.720yun.com/vr/7a0j5dyksk9', 7, 6, 1),
(7,  '文化千岛艺术馆', '千岛艺术馆', '汇聚多元文化艺术作品，展现交通院校美育与文创成果。', 'https://2e6zb07zn85.720yun.com/vr/660j5dyvsv5', 16, 7, 1),
-- 8/9 号馆 VR 暂缺：第三方域名 bafang720.com / eqvrar.com 无法完成微信业务域名校验，
-- web-view 打开即报错；合伙人迁移到 720yun 后再回填链接（原链接见 patch-hall-vr-visibility-20260829.sql）。
-- 展馆本体保留上线：展馆达人徽章要求参观全部 11 馆，不能隐藏展馆。
(8,  '校园安全教育馆', '校园安全教育馆', '校园安全常识、应急演练与警示教育，VR 全景漫游正在筹备中。', NULL, 17, 8, 1),
(9,  '西部山区道路运输安全警示教育基地', '西部山区安全基地', '面向山区道路运输场景的典型案例与安全警示教育，VR 全景漫游正在筹备中。', NULL, 17, 9, 1),
(10, '节水宣传教育中心', '节水宣传中心', '节水理念、技术与宣传教育成果展示。', 'https://2e6zb07zn85.720yun.com/vr/f7bj5pmOkO2', 18, 10, 1),
(11, '牙舟陶数字展厅', '牙舟陶展厅', '国家级非物质文化遗产牙舟陶数字展陈，汇集百余件 3D 数字化展品，依托 VR 全景漫游赏析器物造型、窑变釉色与民俗纹饰，感受贵州本土陶艺魅力。', 'https://2e6zb07zn85.720yun.com/vr/e96je04kew9', 16, 11, 1);

-- 沉浸式章节（校史馆示例）
INSERT IGNORE INTO `hall_section` (`id`, `hall_id`, `title`, `sort`) VALUES
(1, 2, '办学历程', 1),
(2, 2, '重要里程碑', 2),
(3, 2, '校训校风', 3);

INSERT IGNORE INTO `hall_media` (`hall_id`, `section_id`, `media_type`, `url`, `caption`, `sort`) VALUES
(2, 1, 'image', '', '建校初期校舍与首批师生合影', 1),
(2, 1, 'image', '', '关键发展节点大事记展墙', 2),
(2, 2, 'image', '', '升格本科与交通职业大学历程', 1),
(2, 3, 'image', '', '校训释义与校园文化展示', 1);

-- 课程
INSERT IGNORE INTO `course` (`id`, `name`, `intro`, `category_id`, `target_audience`, `duration_minutes`, `start_time`, `subtitle_status`, `status`) VALUES
(1, '示例课程：沟通表达十二讲', '示例内容。从结构化表达到公开演讲，逐步建立表达能力。', 8, '全校学生', 540, '2026-06-01 00:00:00', 'ready', 1),
(2, '示例课程：平台使用入门', '示例内容。一课讲清展馆导览、课程学习、资源下载与活动报名的完整流程。', 9, '全校学生', 360, '2026-05-01 00:00:00', 'none', 1),
(3, '示例课程：数字素养基础', '示例内容。信息检索、资料整理与网络安全常识。', 10, '全校学生', 270, '2026-04-01 00:00:00', 'none', 1),
(4, '示例课程：手工技艺赏析', '示例内容。蜡染、银饰、木作……了解手工技艺的材料与工序。', 10, '全校学生', 450, '2026-03-01 00:00:00', 'none', 1),
(5, '示例课程：书法入门', '示例内容。笔墨纸砚，从执笔运锋到临帖创作，涵养审美与心性。', 11, '全校学生', 540, '2026-02-01 00:00:00', 'none', 1);

-- 活动（含报名时间窗）
INSERT IGNORE INTO `activity` (`id`, `title`, `intro`, `location`, `start_time`, `enroll_start_time`, `enroll_end_time`, `quota`, `enrolled_count`, `status`, `need_review`) VALUES
(1, '示例活动：职业规划专题讲座', '讲座', '明德讲堂', '2026-06-15 14:30:00', '2026-01-01 00:00:00', '2026-06-14 23:59:59', 300, 186, 'published', 0),
(2, '示例活动：平台使用说明会', '活动', '学术报告厅', '2026-06-20 09:00:00', '2026-01-01 00:00:00', '2026-06-19 23:59:59', 240, 240, 'published', 0),
(3, '示例活动：手工技艺体验公开课', '公开课', '实训中心', '2026-06-25 15:00:00', '2026-01-01 00:00:00', '2026-06-24 23:59:59', 120, 88, 'published', 1),
(4, '示例活动：校外研学实践行', '研学', '校外实践基地', '2026-07-02 08:30:00', '2026-01-01 00:00:00', '2026-07-01 23:59:59', 80, 56, 'published', 0);

UPDATE `activity` SET
  `enroll_start_time` = '2026-01-01 00:00:00',
  `enroll_end_time` = CASE `id`
    WHEN 1 THEN '2026-06-14 23:59:59'
    WHEN 2 THEN '2026-06-19 23:59:59'
    WHEN 3 THEN '2026-06-24 23:59:59'
    WHEN 4 THEN '2026-07-01 23:59:59'
  END,
  `need_review` = CASE WHEN `id` = 3 THEN 1 ELSE 0 END
WHERE `id` IN (1, 2, 3, 4);

-- 首页推荐（3 新闻 + 6 展馆 + 2 课程，与 demo 结构一致）
INSERT IGNORE INTO `home_recommend` (`id`, `module_type`, `target_id`, `sort`, `status`) VALUES
(1, 'news',   1, 1, 1),
(2, 'news',   2, 2, 1),
(3, 'news',   3, 3, 1),
(4, 'hall',   1, 1, 1),
(5, 'hall',   2, 2, 1),
(6, 'hall',   3, 3, 1),
(7, 'hall',   4, 4, 1),
(8, 'hall',   5, 5, 1),
(9, 'hall',   6, 6, 1),
(10, 'course', 1, 1, 1),
(11, 'course', 2, 2, 1);

-- 文创
INSERT IGNORE INTO `craft` (`id`, `name`, `intro_zh`, `intro_en`, `category_id`, `sort`, `status`) VALUES
(1, '示例文创：银饰·蝴蝶冠', '示例内容。以蝴蝶为主题的传统银饰，錾刻与掐丝工艺。', 'Sample item. Traditional silver headdress featuring butterfly motifs.', 12, 1, 1),
(2, '示例文创：蜡染壁挂·山水', '示例内容。以蜡染工艺呈现山水意境，靛蓝与白坯的层次变化。', 'Sample item. Batik wall hanging depicting a landscape scene.', 12, 2, 1),
(3, '示例文创：石雕·戏剧面具', '示例内容。传统石雕面具，线条粗犷，保留手工凿痕。', 'Sample item. Stone-carved opera mask, traditional craft.', 12, 3, 1);

INSERT IGNORE INTO `craft_image` (`craft_id`, `image_url`, `angle_label`, `sort`) VALUES
(1, 'https://cdn.example.com/craft/silver-1.jpg', '正面', 1),
(1, 'https://cdn.example.com/craft/silver-2.jpg', '侧面', 2),
(2, 'https://cdn.example.com/craft/batik-1.jpg', '全景', 1),
(3, 'https://cdn.example.com/craft/mask-1.jpg', '正面', 1);

INSERT IGNORE INTO `craft_contact` (`craft_id`, `phone`, `wechat`, `email`) VALUES
(1, '0851-12345678', 'shuyuan_craft', 'craft@example.com'),
(2, '0851-12345678', 'shuyuan_craft', 'craft@example.com'),
(3, '0851-12345678', 'shuyuan_craft', 'craft@example.com');

-- 学习资源
INSERT IGNORE INTO `resource` (`id`, `name`, `file_url`, `preview_url`, `file_type`, `file_size_kb`, `category_id`, `download_count`, `status`) VALUES
(1, '示例资料：沟通表达导读.pdf', 'https://cdn.example.com/res/sample-1.pdf', 'https://cdn.example.com/res/sample-1.pdf', 'pdf', 2048, 14, 128, 1),
(2, '示例资料：平台使用手册.ppt', 'https://cdn.example.com/res/sample-2.ppt', NULL, 'ppt', 5120, 14, 86, 1),
(3, '示例资料：手工技艺入门读本.doc', 'https://cdn.example.com/res/sample-3.doc', NULL, 'word', 1024, 15, 64, 1),
(4, '示例资料：手工技艺赏析视频.mp4', 'https://cdn.example.com/res/sample-4.mp4', 'https://cdn.example.com/res/sample-4.mp4', 'mp4', 15360, 15, 42, 1);

-- 搜索索引（从已发布内容同步）
INSERT IGNORE INTO `search_index` (`target_type`, `target_id`, `title`, `summary`, `status`, `publish_time`) VALUES
('news', 1, '示例：云端书院小程序上线试运行', '平台上线试运行', 1, '2026-06-05 10:00:00'),
('news', 2, '示例：线上展馆新增语音讲解', '展馆语音导览', 1, '2026-06-03 09:00:00'),
('hall', 1, '贵州交通博物馆·教育馆', '交通博物馆 VR 展馆', 1, '2026-01-01 00:00:00'),
('hall', 2, '校史馆', '校史 VR 展馆', 1, '2026-01-01 00:00:00'),
('hall', 3, '贵州交通红色教育基地', '红色教育 VR 展馆', 1, '2026-01-01 00:00:00'),
('craft', 1, '示例文创：银饰·蝴蝶冠', '传统银饰示例', 1, '2026-01-01 00:00:00'),
('course', 1, '示例课程：沟通表达十二讲', '表达能力系列课', 1, '2026-06-01 00:00:00'),
('resource', 1, '示例资料：沟通表达导读.pdf', 'PDF 学习资料', 1, '2026-01-01 00:00:00');

-- 个人中心演示数据（测试学员 member_id=1）
INSERT IGNORE INTO `favorite` (`member_id`, `target_type`, `target_id`) VALUES
(1, 'news', 1),
(1, 'hall', 1),
(1, 'craft', 1),
(1, 'course', 1);

INSERT IGNORE INTO `enroll` (`id`, `activity_id`, `member_id`, `name`, `phone`, `college`, `status`, `voucher_code`) VALUES
(1, 1, 1, '测试学员', '13800001234', '中华文化书院', 'approved', 'V20260001'),
(2, 3, 1, '测试学员', '13800001234', '中华文化书院', 'pending', NULL);

INSERT IGNORE INTO `download_record` (`member_id`, `resource_id`, `file_name`, `downloaded_at`) VALUES
(1, 1, '示例资料：沟通表达导读.pdf', '2026-06-10 14:20:00'),
(1, 2, '示例资料：平台使用手册.ppt', '2026-06-08 09:15:00');

INSERT IGNORE INTO `event_log` (`member_id`, `event_type`, `target_type`, `target_id`, `created_at`) VALUES
(1, 'view', 'news', 1, '2026-06-12 10:00:00'),
(1, 'favorite', 'hall', 1, '2026-06-11 16:30:00'),
(1, 'play', 'course', 1, '2026-06-10 20:00:00'),
(1, 'download', 'resource', 1, '2026-06-10 14:20:00'),
(1, 'enroll', 'activity', 1, '2026-06-09 11:00:00');

INSERT IGNORE INTO `member_badge` (`member_id`, `badge_id`, `achieved_at`) VALUES
(1, 1, '2026-06-01 08:00:00');

-- 关联小程序。
-- 真实存在的关联小程序**只有「通途星」一个**，且 AppID 尚未拿到，先留占位符；
-- 拿到后填进 miniapp/config/navigate-appids.json 并执行 scripts/sync-navigate-appids.js。
-- 其余两条是演示条目，用来展示列表的两种形态（跳转 / 图文），不是真实学院。
-- 早先这里铺了 11 个学院名，其中「马克思主义学院」等既不是真实关联对象，
-- 又正好撞在要回避的表述上——首页「关联应用」把它们直接显示了出来。
INSERT IGNORE INTO `college_app` (`id`, `name`, `description`, `sort`, `status`, `content_type`, `appid`, `path`) VALUES
(1, '通途星',         '关联小程序 · AppID 待配置',   1, 1, 'jump',   'wxPLACEHOLDER001', 'pages/index/index'),
(2, '示例关联应用 A', '示例条目 · 用于演示列表布局', 2, 1, 'manual', NULL, NULL),
(3, '示例关联应用 B', '示例条目 · 用于演示跳转形态', 3, 1, 'jump',   'wxPLACEHOLDER002', 'pages/index/index');

-- AI 知识库演示资料（关键词检索，无 API Key 亦可演示 Fallback 回答）
INSERT IGNORE INTO `knowledge_doc` (`id`, `title`, `file_url`, `source_type`, `char_count`, `chunk_count`, `status`, `uploaded_by`, `created_at`) VALUES
(1, '平台功能说明', 'manual://平台功能说明', 'manual', 420, 3, 'ready', 1, '2026-07-01 10:00:00'),
(2, '云端书院简介', 'manual://云端书院简介', 'manual', 380, 2, 'ready', 1, '2026-07-01 10:05:00');

INSERT IGNORE INTO `knowledge_chunk` (`id`, `doc_id`, `chunk_text`, `chunk_index`, `keywords`, `char_count`) VALUES
(1, 1, '线上展馆：在「展馆」页选择展馆后进入详情，点「进入 VR」可打开 720 全景漫游；部分展馆配有图文与语音讲解，支持收藏与生成分享海报。', 0, '展馆 VR 全景 讲解', 72),
(2, 1, '课程学习：在「课程」页选课后进入播放页，进度会自动记录，下次从上次位置续播；部分课程支持字幕，可在播放页开关。', 1, '课程 播放 进度 字幕', 78),
(3, 1, '活动报名：在「报名」页选择活动，报名成功后可在个人中心查看凭证码；部分活动需管理员审核，通过后才会生成凭证。', 2, '活动 报名 凭证 审核', 58),
(4, 2, '云端书院是面向校园的线上学习与活动服务平台，整合线上展馆、课程学习、资源下载、活动报名、文创展示与智能问答六个模块。', 0, '云端书院 平台 模块', 82),
(5, 2, '账号由管理员统一导入，不开放自助注册；首次微信登录需绑定管理员分配的账号与密码。智能问答每日有次数上限，回答仅供参考。', 1, '账号 登录 绑定 智能问答', 72);

