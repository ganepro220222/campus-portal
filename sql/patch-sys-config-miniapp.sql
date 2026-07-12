-- AI 助手与搜索热词可配置项（旧库升级）
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `remark`) VALUES
('ai_assistant_welcome', '你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。', 'AI 助手欢迎语'),
('ai_assistant_chips',   '["什么是阳明文化？","屯堡文化有何特色？","龙场悟道讲了什么？"]', 'AI 助手推荐问题'),
('search_hot_tags',      '["阳明文化","屯堡地戏","红色交通","非遗银饰","知行合一"]', '搜索热词');
