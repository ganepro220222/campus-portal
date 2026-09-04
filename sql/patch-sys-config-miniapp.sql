-- AI 助手与搜索热词可配置项（旧库升级）
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `remark`) VALUES
('ai_assistant_welcome', '你好，可以基于平台知识库为你解答使用与学习相关的问题。', '问答欢迎语'),
('ai_assistant_chips',   '["平台有哪些线上展馆？","怎么报名参加活动？","在哪查看学习足迹？"]', 'AI 助手推荐问题'),
('search_hot_tags',      '["线上展馆","精品课程","活动报名","学习资源","文创展示"]', '搜索热词');
