-- 知识库文档：新增 content 列，保存手动录入的原始正文，供「编辑」回填。
-- 新库已并入 init.sql；旧库可重复执行本 patch（幂等）。
-- 旧数据 content 为空时，后端「编辑」会由分段近似还原正文兜底。

SET @db := DATABASE();

SET @sql := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = @db AND table_name = 'knowledge_doc' AND column_name = 'content'
        ),
        'SELECT ''skip: knowledge_doc.content exists'' AS migration_note',
        'ALTER TABLE `knowledge_doc` ADD COLUMN `content` LONGTEXT DEFAULT NULL COMMENT ''手动录入原始正文（供编辑回填）'' AFTER `source_type`'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
