-- 为已有库补充分类管理权限（category:read / category:write）
UPDATE `sys_role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'category:read')
WHERE JSON_SEARCH(`permissions`, 'one', 'category:read') IS NULL
  AND (`role_name` = '超级管理员' OR `role_name` = '内容编辑');

UPDATE `sys_role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'category:write')
WHERE JSON_SEARCH(`permissions`, 'one', 'category:write') IS NULL
  AND (`role_name` = '超级管理员' OR `role_name` = '内容编辑');
