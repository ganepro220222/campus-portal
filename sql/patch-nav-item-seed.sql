-- 首页功能入口默认数据（已有库执行一次）
INSERT IGNORE INTO `nav_item` (`id`, `label`, `icon`, `path`, `sort`, `status`) VALUES
(1, '书院动态', 'entry-news',     '/pages/news/index',        1, 1),
(2, '展馆展示', 'museum',         '/pages/hall/index',        2, 1),
(3, '课程中心', 'course',         '/pages/course/index',      3, 1),
(4, '资源下载', 'entry-resource', '/packageB/resource/list', 4, 1),
(5, '报名',     'entry-enroll',   '/pages/activity/index',    5, 1);
