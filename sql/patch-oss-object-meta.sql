-- 上传对象元信息表（后台预览框显示真实文件名 / 大小 / 上传时间）
--
-- 背景：OSS 对象名是 32 位 hex + 后缀，后台把它挡掉不给老师看，于是刷新页面后
-- 上传框里只剩「PDF 文件」这种占位文案，老师无从确认自己传的到底是哪一个版本。
--
-- 幂等：可重复执行；init.sql 已建表的新库会直接跳过。
-- 老库执行本补丁后，历史对象没有元信息记录，后台仍按后缀显示「PDF 文件」，
-- 重新上传一次即可补齐，不需要回填。
--
-- ECS 执行:
--   mysql ... shuyuan < /opt/shuyuan/sql/patch-oss-object-meta.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `oss_object_meta` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `object_key`    VARCHAR(255) NOT NULL COMMENT 'OSS 对象名（不含域名与 bucket）',
  `original_name` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '上传时的原始文件名',
  `size_bytes`    BIGINT       NOT NULL DEFAULT 0 COMMENT '字节数',
  `scene`         VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '上传场景',
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_object_key` (`object_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上传对象元信息';
