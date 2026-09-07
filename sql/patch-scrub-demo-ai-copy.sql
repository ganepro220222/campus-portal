-- 把示例稿、导航和配置里的「智能问答」等字样换成中性说法。可重复执行。

SET NAMES utf8mb4;

-- 动态标题 / 摘要 / 正文
UPDATE `news` SET
  `title` = REPLACE(REPLACE(REPLACE(`title`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕'),
  `summary` = REPLACE(REPLACE(REPLACE(REPLACE(`summary`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕'), '字幕由后台生成', '字幕由管理员配置'),
  `content` = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`content`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕'), '字幕由后台生成', '字幕由管理员配置'), '内容由 AI 生成', '')
WHERE `title` LIKE '%AI%' OR `title` LIKE '%自动字幕%'
   OR `summary` LIKE '%AI%' OR `summary` LIKE '%自动字幕%' OR `summary` LIKE '%后台生成%'
   OR `content` LIKE '%AI%' OR `content` LIKE '%自动字幕%' OR `content` LIKE '%后台生成%';

-- 课程名 / 简介
UPDATE `course` SET
  `name` = REPLACE(REPLACE(REPLACE(`name`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕'),
  `intro` = REPLACE(REPLACE(REPLACE(`intro`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕')
WHERE `name` LIKE '%AI%' OR `name` LIKE '%自动字幕%'
   OR `intro` LIKE '%AI%' OR `intro` LIKE '%自动字幕%';

-- 分类名（后台建过「AI 字幕」时，课程胶囊会直接显示分类名）
UPDATE `category` SET `name` = '字幕'
WHERE `name` IN ('AI 字幕', 'AI字幕');

-- 首页导航
UPDATE `nav_item` SET `label` = '知识问答'
WHERE `label` IN ('智能问答', 'AI 智能问答', 'AI问答', '书院助手');

-- 搜索索引跟列表标题走
UPDATE `search_index` SET
  `title` = REPLACE(REPLACE(REPLACE(`title`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕'),
  `summary` = REPLACE(REPLACE(REPLACE(`summary`, 'AI 字幕', '字幕'), 'AI字幕', '字幕'), '自动字幕', '字幕')
WHERE `title` LIKE '%AI%' OR `title` LIKE '%自动字幕%'
   OR `summary` LIKE '%AI%' OR `summary` LIKE '%自动字幕%';

-- 欢迎语：旧稿「书院助手」自称
UPDATE `sys_config` SET `config_value` = '你好，可以基于平台知识库为你解答使用与学习相关的问题。'
WHERE `config_key` = 'ai_assistant_welcome'
  AND `config_value` IN (
    '你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。',
    '你好！我是书院助手，可以基于平台知识库为你解答使用与学习相关的问题。'
  );

-- 后台配置项说明（老师若打开系统配置页会看到 remark）
UPDATE `sys_config` SET `remark` = '每用户每日知识问答次数上限'
WHERE `config_key` = 'ai_daily_limit' AND `remark` LIKE '%AI%';
UPDATE `sys_config` SET `remark` = '问答答案缓存时长（秒）'
WHERE `config_key` = 'ai_cache_ttl' AND `remark` LIKE '%AI%';
UPDATE `sys_config` SET `remark` = '问答推荐问题'
WHERE `config_key` = 'ai_assistant_chips' AND `remark` LIKE '%AI%';
