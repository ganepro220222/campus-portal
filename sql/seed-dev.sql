-- sql/seed-dev.sql — 开发环境演示数据（在 init.sql 之后执行）
-- 用法：mysql -uroot -pdev123456 shuyuan < sql/seed-dev.sql

SET NAMES utf8mb4;

USE shuyuan;

-- 测试学员（学号 2021001，密码 Admin@123，与后台超管相同 BCrypt）
INSERT IGNORE INTO `member` (`id`, `openid`, `nickname`, `points`, `status`) VALUES
(1, 'dev_test', '测试学员', 28, 1);

-- 超管密码同步为 Admin@123（与 init.sql 旧哈希不一致时用 UPDATE 修正）
UPDATE `sys_user` SET `password_hash` = '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm'
WHERE `username` = 'admin';

UPDATE `sys_role` SET `role_name` = '超级管理员',
  `permissions` = '["admin:super","news:read","news:write","news:publish","hall:read","hall:write","course:read","course:write","enroll:read","enroll:export","stats:view","category:read","category:write"]'
WHERE `id` = 1;

INSERT IGNORE INTO `member_profile` (`member_id`, `real_name`, `college`, `phone`) VALUES
(1, '测试学员', '贵州交通职业大学 · 中华文化书院', '13800001234')
ON DUPLICATE KEY UPDATE `phone` = VALUES(`phone`), `real_name` = VALUES(`real_name`);

INSERT IGNORE INTO `member_account` (`member_id`, `student_no`, `username`, `password_hash`, `status`) VALUES
(1, '2021001', '2021001', '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm', 1);

-- 分类
INSERT IGNORE INTO `category` (`id`, `type`, `name`, `sort`, `status`) VALUES
(1,  'news',   '书院动态', 1, 1),
(2,  'news',   '活动通知', 2, 1),
(3,  'news',   '文化传承', 3, 1),
(4,  'hall',   '博物馆与校史', 1, 1),
(5,  'hall',   '红色教育', 2, 1),
(6,  'hall',   '研学服务', 3, 1),
(7,  'hall',   '素质教育', 4, 1),
(16, 'hall',   '文化艺术', 5, 1),
(17, 'hall',   '安全教育', 6, 1),
(18, 'hall',   '主题宣教', 7, 1),
(19, 'hall',   '待上线', 8, 1),
(8,  'course', '阳明文化', 1, 1),
(9,  'course', '思政必修', 2, 1),
(10, 'course', '文化传承', 3, 1),
(11, 'course', '美育素养', 4, 1),
(12, 'craft',   '非遗工艺', 1, 1),
(13, 'craft',   '书画艺术', 2, 1),
(14, 'resource','思政学习', 1, 1),
(15, 'resource','文化读本', 2, 1);

-- Banner
INSERT IGNORE INTO `banner` (`id`, `title`, `description`, `image_url`, `link_type`, `link_value`, `sort`, `status`) VALUES
(1, '王阳明“知行合一”专题讲座圆满举行', '名家云集，共探黔中阳明心学的当代价值', NULL, 'page', '/packageA/news/detail?id=1', 1, 1),
(2, '“通途之路”研学品牌正式启动', '线上承载 · 线下研学，打造协同育人新格局', NULL, 'page', '/pages/hall/index', 2, 1),
(3, '屯堡地戏走进校园 · 六百年非遗活态传承', '沉浸式线上展馆同步上线，可听语音讲解', NULL, 'page', '/pages/course/index', 3, 1);

-- 公告
INSERT IGNORE INTO `announcement` (`id`, `content`, `sort`, `status`, `start_time`, `end_time`) VALUES
(1, '云端书院小程序上线试运行，欢迎师生浏览体验', 1, 1, '2026-01-01 00:00:00', '2027-12-31 23:59:59');

-- 新闻
INSERT IGNORE INTO `news` (`id`, `title`, `summary`, `content`, `category_id`, `status`, `view_count`, `publish_time`) VALUES
(1, '中华文化书院举办王阳明“知行合一”专题讲座',
 '月五日，贵州交通职业大学中华文化书院在明德讲堂举办专题讲座，深入阐释阳明心学。',
 '主讲人结合黔中文化与当代育人实践，指出阳明心学“知行合一”的理念，对于新时代青年学子立德修身、笃行实干具有重要的现实意义。现场互动热烈，师生纷纷表示受益匪浅。\n\n据悉，本次讲座是书院“马院 + 书院”协同育人系列活动之一，后续还将依托云端书院平台陆续推出线上课程与线上展馆。',
 1, 'published', 1234, '2026-06-05 10:00:00'),
(2, '“通途之路”研学品牌启动仪式在我校举行',
 '研学品牌正式启动，打造协同育人新格局。',
 '“通途之路”研学品牌聚焦交通文化与红色传承，线上线下联动开展。',
 2, 'published', 980, '2026-06-03 09:00:00'),
(3, '屯堡地戏走进校园：非遗活态传承公开课开讲',
 '六百年江南遗风走进课堂。',
 '屯堡地戏被誉为“戏剧活化石”，本次公开课带领师生沉浸式体验非遗魅力。',
 3, 'published', 1500, '2026-06-01 14:00:00'),
(4, '阳明心学十二讲课程上线，欢迎选学',
 '线上课程开放选学。',
 '课程围绕心即理、知行合一、致良知三大命题展开。',
 1, 'published', 860, '2026-05-28 08:00:00'),
(5, '红色交通史主题展在校史馆开展',
 '校史馆主题展开展。',
 '展览回顾贵州交通发展脉络与红色记忆。',
 3, 'published', 742, '2026-05-25 10:00:00'),
(6, '关于开展 2026 年传统文化系列研学活动的通知',
 '传统文化研学活动通知。',
 '活动面向全校师生，详情见活动报名页。',
 2, 'published', 655, '2026-05-20 09:00:00');

-- 展馆（11 馆 — 校方 VR 展馆清单）
INSERT IGNORE INTO `hall` (`id`, `name`, `short_name`, `intro`, `vr_url`, `category_id`, `sort`, `status`) VALUES
(1,  '贵州交通博物馆·教育馆', '交通博物馆', '贵州交通发展历程与教育成果数字化展陈，支持 VR 全景漫游与图文介绍。', 'https://roma.720yun.com/vr/515a9635070ca212/', 4, 1, 1),
(2,  '校史馆', '校史馆', '回顾贵州交通职业大学办学历程与重要里程碑，传承校训校风。', 'https://roma.720yun.com/vr/b5b7196093f3c25a/', 4, 2, 1),
(3,  '贵州交通红色教育基地', '红色教育基地', '弘扬长征精神与交通红色基因，开展沉浸式红色文化育人。', 'https://roma.720yun.com/vr/59e140eb05f9e134/', 5, 3, 1),
(4,  '交旅融合研学服务中心', '交旅研学', '交旅融合主题研学服务展示，连接线上云游与线下研学实践。', 'https://roma.720yun.com/vr/96cb6946cefd5b99/', 6, 4, 1),
(5,  '学生素质发展中心', '素质发展中心', '学生综合素质培养成果与活动空间线上展示。', 'https://www.720yun.com/vr/374j5dyvrf2', 7, 5, 1),
(6,  '学生科普体验中心', '科普体验中心', '交通科技与学生科普互动体验场景，激发科学探索兴趣。', 'https://www.720yun.com/vr/7a0j5dyksk9', 7, 6, 1),
(7,  '文化千岛艺术馆', '千岛艺术馆', '汇聚多元文化艺术作品，展现交通院校美育与文创成果。', 'https://www.720yun.com/vr/660j5dyvsv5', 16, 7, 1),
(8,  '校园安全教育馆1', '校园安全教育馆', '校园安全常识、应急演练与警示教育图文展陈，VR 链接筹备中。', NULL, 17, 8, 1),
(9,  '西部山区道路运输安全警示教育基地', '西部山区安全基地', '面向山区道路运输场景的典型案例与安全警示教育，VR 链接筹备中。', NULL, 17, 9, 1),
(10, '节水宣传教育中心', '节水宣传中心', '节水理念、技术与宣传教育成果展示。', 'https://www.720yun.com/vr/f7bj5pmOkO2', 18, 10, 1),
(11, '新展馆筹备中', '敬请期待', '第 11 个展馆正在制作中，名称与 VR 链接确定后将上线。', NULL, 19, 11, 0);

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
(1, '阳明心学十二讲', '从龙场悟道到致良知，系统讲授阳明心学的精髓与当代价值。', 8, '全校学生', 540, '2026-06-01 00:00:00', 'ready', 1),
(2, '长征精神与红色交通史', '重温红色交通线，传承长征精神，赓续红色血脉。', 9, '全校学生', 360, '2026-05-01 00:00:00', 'none', 1),
(3, '屯堡文化探源', '走进六百年江南遗风，解读屯堡地戏与石头建筑的活态传承。', 10, '全校学生', 270, '2026-04-01 00:00:00', 'none', 1),
(4, '贵州非遗技艺赏析', '蜡染、银饰、地戏……感受多彩黔中的匠心与巧思。', 10, '全校学生', 450, '2026-03-01 00:00:00', 'none', 1),
(5, '中华书法入门', '笔墨纸砚，从执笔运锋到临帖创作，涵养审美与心性。', 11, '全校学生', 540, '2026-02-01 00:00:00', 'none', 1);

-- 活动（含报名时间窗）
INSERT IGNORE INTO `activity` (`id`, `title`, `intro`, `location`, `start_time`, `enroll_start_time`, `enroll_end_time`, `quota`, `enrolled_count`, `status`, `need_review`) VALUES
(1, '“知行合一”阳明文化专题讲座', '讲座', '明德讲堂', '2026-06-15 14:30:00', '2026-01-01 00:00:00', '2026-06-14 23:59:59', 300, 186, 'published', 0),
(2, '“通途之路”研学品牌启动仪式', '活动', '学术报告厅', '2026-06-20 09:00:00', '2026-01-01 00:00:00', '2026-06-19 23:59:59', 240, 240, 'published', 0),
(3, '屯堡地戏非遗活态传承公开课', '公开课', '非遗技艺馆', '2026-06-25 15:00:00', '2026-01-01 00:00:00', '2026-06-24 23:59:59', 120, 88, 'published', 1),
(4, '红色交通史主题研学行', '研学', '遵义会议会址', '2026-07-02 08:30:00', '2026-01-01 00:00:00', '2026-07-01 23:59:59', 80, 56, 'published', 0);

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
INSERT IGNORE INTO `craft` (`id`, `name`, `intro_zh`, `intro_en`, `category_id`, `preview_type`, `sort`, `status`) VALUES
(1, '苗族银饰·蝴蝶冠', '贵州苗族传统银饰，以蝴蝶妈妈为图腾，寓意生命与美好。', 'Traditional Miao silver headdress featuring butterfly motifs.', 12, 'multi_image', 1, 1),
(2, '蜡染壁挂·山水阳明', '以蜡染工艺呈现龙场山水与阳明先生悟道意境。', 'Batik wall hanging depicting Yangming\'s enlightenment landscape.', 12, 'multi_image', 2, 1),
(3, '屯堡石雕·地戏面具', '屯堡传统石雕地戏面具，六百年非遗活态传承。', 'Tunpu stone-carved opera mask, living heritage craft.', 12, 'model3d', 3, 1);

UPDATE `craft` SET `model_3d_url` = 'https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/damage-helmet/index.glb'
WHERE `id` = 3 AND (`model_3d_url` IS NULL OR `model_3d_url` = '');

INSERT IGNORE INTO `craft_image` (`craft_id`, `image_url`, `angle_label`, `sort`) VALUES
(1, 'https://cdn.example.com/craft/silver-1.jpg', '正面', 1),
(1, 'https://cdn.example.com/craft/silver-2.jpg', '侧面', 2),
(2, 'https://cdn.example.com/craft/batik-1.jpg', '全景', 1),
(3, 'https://cdn.example.com/craft/mask-1.jpg', '正面', 1);

INSERT IGNORE INTO `craft_contact` (`craft_id`, `phone`, `wechat`, `email`) VALUES
(1, '0851-12345678', 'shuyuan_craft', 'craft@gzjtzy.edu.cn'),
(2, '0851-12345678', 'shuyuan_craft', 'craft@gzjtzy.edu.cn'),
(3, '0851-12345678', 'shuyuan_craft', 'craft@gzjtzy.edu.cn');

-- 学习资源
INSERT IGNORE INTO `resource` (`id`, `name`, `file_url`, `preview_url`, `file_type`, `file_size_kb`, `category_id`, `download_count`, `status`) VALUES
(1, '阳明心学导读.pdf', 'https://cdn.example.com/res/yangming.pdf', 'https://cdn.example.com/res/yangming.pdf', 'pdf', 2048, 14, 128, 1),
(2, '长征精神学习课件.ppt', 'https://cdn.example.com/res/changzheng.ppt', NULL, 'ppt', 5120, 14, 86, 1),
(3, '屯堡文化读本.doc', 'https://cdn.example.com/res/tunpu.doc', NULL, 'word', 1024, 15, 64, 1),
(4, '非遗技艺赏析视频.mp4', 'https://cdn.example.com/res/feiyi.mp4', 'https://cdn.example.com/res/feiyi.mp4', 'mp4', 15360, 15, 42, 1);

-- 搜索索引（从已发布内容同步）
INSERT IGNORE INTO `search_index` (`target_type`, `target_id`, `title`, `summary`, `status`, `publish_time`) VALUES
('news', 1, '中华文化书院举办王阳明“知行合一”专题讲座', '阳明心学专题讲座', 1, '2026-06-05 10:00:00'),
('news', 2, '“通途之路”研学品牌启动仪式在我校举行', '研学品牌启动', 1, '2026-06-03 09:00:00'),
('hall', 1, '贵州交通博物馆·教育馆', '交通博物馆 VR 展馆', 1, '2026-01-01 00:00:00'),
('hall', 2, '校史馆', '校史 VR 展馆', 1, '2026-01-01 00:00:00'),
('hall', 3, '贵州交通红色教育基地', '红色教育 VR 展馆', 1, '2026-01-01 00:00:00'),
('craft', 1, '苗族银饰·蝴蝶冠', '贵州苗族传统银饰', 1, '2026-01-01 00:00:00'),
('course', 1, '阳明心学十二讲', '系统讲授阳明心学', 1, '2026-06-01 00:00:00'),
('resource', 1, '阳明心学导读.pdf', 'PDF 学习资料', 1, '2026-01-01 00:00:00');

-- 个人中心演示数据（测试学员 member_id=1）
INSERT IGNORE INTO `favorite` (`member_id`, `target_type`, `target_id`) VALUES
(1, 'news', 1),
(1, 'hall', 1),
(1, 'craft', 1),
(1, 'course', 1);

INSERT IGNORE INTO `enroll` (`id`, `activity_id`, `member_id`, `name`, `phone`, `college`, `status`, `voucher_code`) VALUES
(1, 1, 1, '测试学员', '13800001234', '贵州交通职业大学 · 中华文化书院', 'approved', 'V20260001'),
(2, 3, 1, '测试学员', '13800001234', '贵州交通职业大学 · 中华文化书院', 'pending', NULL);

INSERT IGNORE INTO `download_record` (`member_id`, `resource_id`, `file_name`, `downloaded_at`) VALUES
(1, 1, '阳明心学导读.pdf', '2026-06-10 14:20:00'),
(1, 2, '长征精神学习课件.ppt', '2026-06-08 09:15:00');

INSERT IGNORE INTO `event_log` (`member_id`, `event_type`, `target_type`, `target_id`, `created_at`) VALUES
(1, 'view', 'news', 1, '2026-06-12 10:00:00'),
(1, 'favorite', 'hall', 1, '2026-06-11 16:30:00'),
(1, 'play', 'course', 1, '2026-06-10 20:00:00'),
(1, 'download', 'resource', 1, '2026-06-10 14:20:00'),
(1, 'enroll', 'activity', 1, '2026-06-09 11:00:00');

INSERT IGNORE INTO `member_badge` (`member_id`, `badge_id`, `achieved_at`) VALUES
(1, 1, '2026-06-01 08:00:00');

-- 学院矩阵（手动录入演示数据，与小程序 mock 对齐）
INSERT IGNORE INTO `college_app` (`id`, `name`, `description`, `sort`, `status`, `content_type`) VALUES
(1,  '马克思主义学院', '马院 + 书院协同育人', 1,  1, 'manual'),
(2,  '轨道交通学院',   '轨道牵引 · 智慧运维', 2,  1, 'manual'),
(3,  '智能交通学院',   '车路协同 · 智慧出行', 3,  1, 'manual'),
(4,  '汽车工程学院',   '新能源 · 智能网联',   4,  1, 'manual'),
(5,  '路桥工程学院',   '通途之路 · 大国工匠', 5,  1, 'manual'),
(6,  '交通运输学院',   '运输组织 · 物流管理', 6,  1, 'manual'),
(7,  '航运航空学院',   '海空联运 · 蓝色梦想', 7,  1, 'manual'),
(8,  '建筑工程学院',   '匠筑营造 · 品质人居', 8,  1, 'manual'),
(9,  '信息工程学院',   '数字技术 · 智能应用', 9,  1, 'manual'),
(10, '经济管理学院',   '经世致用 · 知行合一', 10, 1, 'manual'),
(11, '人文艺术学院',   '以美育人 · 以文化人', 11, 1, 'manual');

