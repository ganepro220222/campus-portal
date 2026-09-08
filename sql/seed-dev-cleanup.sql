-- 清空演示数据。只删演示行，不动表结构与基础角色、积分规则。
-- 使用前先备份。须先执行 SET @wipe_demo='YES'，且库中仍有演示标记行，否则一行不删。
-- 可重复执行。

DROP PROCEDURE IF EXISTS _assert_demo_seed;
DELIMITER $$
CREATE PROCEDURE _assert_demo_seed(IN confirmed VARCHAR(16))
BEGIN
  DECLARE marker INT DEFAULT 0;

  IF confirmed IS NULL OR confirmed <> 'YES' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = '中止：本脚本会删除全部演示数据，请在执行前 SET @wipe_demo=''YES''。';
  END IF;

  SELECT COUNT(1) INTO marker
  FROM `member`
  WHERE `id` = 1 AND `openid` = 'acct:2021001' AND `nickname` = '测试学员';

  IF marker = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = '中止：找不到 seed-dev 的标记行（member id=1 / acct:2021001 / 测试学员），这个库可能不是演示库。';
  END IF;
END$$
DELIMITER ;

CALL _assert_demo_seed(@wipe_demo);
DROP PROCEDURE _assert_demo_seed;

-- ============================================================
-- 先删引用方，再删被引用方；顺序与 seed-dev.sql 的插入顺序相反
-- ============================================================

-- 1) 行为与索引类（不带业务含义，直接清演示学员那一份）
DELETE FROM `event_log`        WHERE `member_id` = 1;
DELETE FROM `favorite`         WHERE `member_id` = 1;
DELETE FROM `download_record`  WHERE `member_id` = 1;
DELETE FROM `member_badge`     WHERE `member_id` = 1;
DELETE FROM `enroll`           WHERE `id` IN (1, 2);
-- 按 (target_type, target_id) 精确删：不能按 target_type 一刀切，
-- 那会把老师后来自己发布的内容的索引一并抹掉
DELETE FROM `search_index` WHERE
     (`target_type` = 'news'     AND `target_id` BETWEEN 1 AND 6)
  OR (`target_type` = 'hall'     AND `target_id` BETWEEN 1 AND 11)
  OR (`target_type` = 'craft'    AND `target_id` BETWEEN 1 AND 3)
  OR (`target_type` = 'course'   AND `target_id` BETWEEN 1 AND 5)
  OR (`target_type` = 'resource' AND `target_id` BETWEEN 1 AND 4);

-- 2) 首页推荐位：指向下面即将删掉的内容，先摘掉免得成为孤儿
DELETE FROM `home_recommend`   WHERE `id` BETWEEN 1 AND 11;

-- 3) 内容子表
DELETE FROM `hall_section`     WHERE `hall_id` BETWEEN 1 AND 11;
DELETE FROM `hall_media`       WHERE `hall_id` BETWEEN 1 AND 11;
DELETE FROM `craft_image`      WHERE `craft_id` BETWEEN 1 AND 3;
DELETE FROM `craft_contact`    WHERE `craft_id` BETWEEN 1 AND 3;
-- 知识库按「来源」删，不按 id 区间：内置知识库（patch-builtin-knowledge.sql，file_url 为
-- builtin://）用的是自增 id，在没跑过 seed-dev 的库上正好会落到 1、2，
-- 按区间删会把随系统附带的使用指南一起清掉——那不是演示数据。
DELETE FROM `knowledge_chunk`  WHERE `doc_id` IN (
  SELECT `id` FROM `knowledge_doc`
   WHERE `file_url` IN ('manual://平台功能说明', 'manual://云端书院简介'));

-- 4) 内容主表
DELETE FROM `knowledge_doc`
      WHERE `file_url` IN ('manual://平台功能说明', 'manual://云端书院简介');
DELETE FROM `resource`         WHERE `id` BETWEEN 1 AND 4;
DELETE FROM `activity`         WHERE `id` BETWEEN 1 AND 4;
DELETE FROM `course`           WHERE `id` BETWEEN 1 AND 5;
DELETE FROM `craft`            WHERE `id` BETWEEN 1 AND 3;
DELETE FROM `hall`             WHERE `id` BETWEEN 1 AND 11;
DELETE FROM `news`             WHERE `id` BETWEEN 1 AND 6;

-- 5) 站点配置类
DELETE FROM `announcement`     WHERE `id` = 1;
DELETE FROM `banner`           WHERE `id` BETWEEN 1 AND 3;
DELETE FROM `college_app`      WHERE `id` BETWEEN 1 AND 3; -- 通途星及历史示例
-- 分类放在内容之后：内容行的 category_id 指着它
DELETE FROM `category`         WHERE `id` BETWEEN 1 AND 19;

-- 6) 演示学员账号三件套（最后删，前面几步还按 member_id=1 找行）
DELETE FROM `member_account`   WHERE `member_id` = 1;
DELETE FROM `member_profile`   WHERE `member_id` = 1;
DELETE FROM `member`           WHERE `id` = 1;

-- 注意：sys_user / sys_role 不在清理范围内——seed-dev 只是 UPDATE 了它们的
-- 名称与密码，行本身来自 init.sql。删掉就没人能登录后台了。
-- 上线前请改用后台「修改密码」，或重跑 patch-admin-account-security.sql。

SELECT '演示数据已清空。请到后台确认各列表为空，并重设超管密码。' AS done;
