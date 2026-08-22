-- sql/patch-subject-neutral-config.sql
-- 旧库升级：把随 init.sql 写进库、且会直接显示在小程序上的几处默认文案，
-- 换成与「公司主体备案」路径一致的中性表述；并归一化历史数据里的机构占位串。
--
-- 背景：小程序备案主体已是贵州云漫科技有限公司，界面上不再打学校名号；
-- 同时按微信审核口径，尽量避开「新闻 / 文化 / 历史 / 政治」类表述。
-- 代码侧（miniapp、SysConfigService、init.sql）已改完，但**已经建好的库**里
-- 存的还是旧值，接口取库里的值，改代码不会自动生效——所以要跑这一支。
--
-- 安全约定：所有 UPDATE 都带 `WHERE 旧值 = '…'` 精确匹配，
-- 只覆盖从未被人改过的默认值；管理员在后台自己写过的内容一律不动。
-- 可重复执行。
--
-- 用法：mysql -u<user> -p <dbname> < sql/patch-subject-neutral-config.sql

SET NAMES utf8mb4;

-- 1) AI 助手欢迎语：去掉「文化助手 / 文化相关问题」
UPDATE `sys_config` SET `config_value` = '你好！我是书院助手，可以基于平台知识库为你解答使用与学习相关的问题。'
WHERE `config_key` = 'ai_assistant_welcome'
  AND `config_value` = '你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。';

-- 2) AI 助手推荐问题：由内容话题改为功能引导
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

-- 5) 历史数据里的机构占位串：个人中心顶部显示的就是这个字段。
--    它不是用户填的机构，是接口在字段为空时回填的展示串（见 ProfileService#toMemberVo），
--    旧值把学校名带了出来。只改这一个精确串，用户自己填过的机构名不动。
UPDATE `member_profile` SET `college` = '中华文化书院'
WHERE `college` = '贵州交通职业大学 · 中华文化书院';

UPDATE `enroll` SET `college` = '中华文化书院'
WHERE `college` = '贵州交通职业大学 · 中华文化书院';

-- 6) 关于页简介 / 隐私政策 / 用户协议：
--    这三项旧版是写死在 Java 里的默认值，库里通常**没有**对应行，因此这里不做 UPDATE。
--    代码侧已改为「后台没配就返回空」，小程序会落到自带基线。
--    若你们已经在后台「内容配置」里保存过带学校名或 edu.cn 邮箱的版本，
--    请在后台直接改，不要在这里批量替换——那是人工撰写的正式文本。
--    自查：
--      SELECT config_key, LEFT(config_value, 60) FROM sys_config
--      WHERE config_key IN ('about_intro','doc_privacy','doc_agreement',
--                           'contact_address','contact_phone','contact_email');
