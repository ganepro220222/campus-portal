-- 展馆沉浸式章节 seed（验收 §2.4 hall_section + hall_media.section_id）
-- 校史馆 id=2 示例三章

INSERT IGNORE INTO `hall_section` (`id`, `hall_id`, `title`, `sort`) VALUES
(1, 2, '办学历程', 1),
(2, 2, '重要里程碑', 2),
(3, 2, '校训校风', 3);

INSERT IGNORE INTO `hall_media` (`hall_id`, `section_id`, `media_type`, `url`, `caption`, `sort`) VALUES
(2, 1, 'image', '', '建校初期校舍与首批师生合影', 1),
(2, 1, 'image', '', '关键发展节点大事记展墙', 2),
(2, 2, 'image', '', '升格本科与交通职业大学历程', 1),
(2, 3, 'image', '', '校训释义与校园文化展示', 1);
