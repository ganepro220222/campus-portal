-- 上传对象元信息表：后台预览显示真实文件名、大小、上传时间。
-- 可重复执行；新库若已建表会跳过。旧对象可重新上传以补齐元信息。

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
