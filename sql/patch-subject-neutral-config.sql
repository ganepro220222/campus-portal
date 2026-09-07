-- 旧库升级：把会直接显示在小程序上的默认文案改成中性表述。
-- 只覆盖从未改过的默认值。可重复执行。

SET NAMES utf8mb4;

-- 1) 问答欢迎语：去掉「文化助手 / 书院助手」自称
UPDATE `sys_config` SET `config_value` = '你好，可以基于平台知识库为你解答使用与学习相关的问题。'
WHERE `config_key` = 'ai_assistant_welcome'
  AND `config_value` IN (
    '你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。',
    '你好！我是书院助手，可以基于平台知识库为你解答使用与学习相关的问题。'
  );

-- 2) 问答推荐问题：由内容话题改为功能引导
UPDATE `sys_config` SET `config_value` = '["平台有哪些线上展馆？","怎么报名参加活动？","在哪查看学习足迹？"]'
WHERE `config_key` = 'ai_assistant_chips'
  AND `config_value` = '["什么是阳明文化？","屯堡文化有何特色？","龙场悟道讲了什么？"]';

-- 3) 搜索热词：同上
UPDATE `sys_config` SET `config_value` = '["线上展馆","精品课程","活动报名","学习资源","文创展示"]'
WHERE `config_key` = 'search_hot_tags'
  AND `config_value` = '["阳明文化","屯堡地戏","红色交通","非遗银饰","知行合一"]';

-- 4) 徽章名去掉「文化」字样（徽章名在个人中心可见）
UPDATE `badge` SET `name` = '探索之星' WHERE `name` = '文化探索者';
UPDATE `badge` SET `name` = '积分达人' WHERE `name` = '文化传播者';

-- 5) 历史数据里的机构占位串：只改这一个精确串，用户自己填过的机构名不动。
UPDATE `member_profile` SET `college` = '中华文化书院'
WHERE `college` = '贵州交通职业大学 · 中华文化书院';

UPDATE `enroll` SET `college` = '中华文化书院'
WHERE `college` = '贵州交通职业大学 · 中华文化书院';

-- 6) 关于页、隐私政策、用户协议：后台已保存的正式文本请在后台改，这里不批量替换。
