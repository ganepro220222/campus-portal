-- member_account 增加首次登录须改密标记（旧库升级）
ALTER TABLE `member_account`
    ADD COLUMN `must_change_password` TINYINT NOT NULL DEFAULT 0
        COMMENT '是否须下次登录修改密码：1是 0否'
        AFTER `status`;
