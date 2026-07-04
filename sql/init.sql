-- ============================================================
-- 云端书院小程序 · 数据库初始化脚本
-- 字符集：utf8mb4，支持 emoji 和中文排序
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 5.1 用户与权限
-- ============================================================

CREATE TABLE IF NOT EXISTS `sys_role` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name`   VARCHAR(50)  NOT NULL COMMENT '角色名称',
  `permissions` JSON         NOT NULL COMMENT '权限列表',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色';

CREATE TABLE IF NOT EXISTS `sys_user` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`      VARCHAR(50)  NOT NULL COMMENT '登录账号',
  `password_hash` VARCHAR(100) NOT NULL COMMENT 'BCrypt 密码',
  `role_id`       BIGINT       NOT NULL COMMENT '角色ID',
  `real_name`     VARCHAR(50)  DEFAULT NULL COMMENT '真实姓名',
  `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`    TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员账号';

CREATE TABLE IF NOT EXISTS `sys_log` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT       DEFAULT NULL COMMENT '操作人ID',
  `action`     VARCHAR(100) NOT NULL COMMENT '操作动作',
  `target`     VARCHAR(200) DEFAULT NULL COMMENT '操作对象',
  `ip`         VARCHAR(50)  DEFAULT NULL COMMENT '客户端IP',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台操作日志';

CREATE TABLE IF NOT EXISTS `member` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid`      VARCHAR(100) NOT NULL COMMENT '微信 openid',
  `nickname`    VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  `avatar`      VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `points`      INT          NOT NULL DEFAULT 0 COMMENT '积分余额',
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1正常 0禁用',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序用户';

CREATE TABLE IF NOT EXISTS `member_account` (
  `id`            BIGINT      NOT NULL AUTO_INCREMENT,
  `member_id`     BIGINT      NOT NULL COMMENT '关联用户ID',
  `student_no`    VARCHAR(50) DEFAULT NULL COMMENT '学号',
  `username`      VARCHAR(50) DEFAULT NULL COMMENT '账号名',
  `password_hash` VARCHAR(100) NOT NULL COMMENT 'BCrypt 密码',
  `status`        TINYINT     NOT NULL DEFAULT 1,
  `create_time`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`    TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_no` (`student_no`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学号/账号登录';

CREATE TABLE IF NOT EXISTS `member_profile` (
  `member_id`   BIGINT      NOT NULL COMMENT '用户ID（主键）',
  `real_name`   VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `college`     VARCHAR(100) DEFAULT NULL COMMENT '所在学院',
  `grade`       VARCHAR(20) DEFAULT NULL COMMENT '年级',
  `phone`       VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户扩展信息';

-- ============================================================
-- 5.2 内容主体
-- ============================================================

CREATE TABLE IF NOT EXISTS `category` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `type`        VARCHAR(30) NOT NULL COMMENT '所属模块：news/hall/craft/course/resource',
  `name`        VARCHAR(50) NOT NULL COMMENT '分类名称',
  `sort`        INT         NOT NULL DEFAULT 0 COMMENT '排序（升序）',
  `status`      TINYINT     NOT NULL DEFAULT 1,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容分类';

CREATE TABLE IF NOT EXISTS `news` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `title`        VARCHAR(200) NOT NULL COMMENT '标题',
  `cover`        VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
  `content`      LONGTEXT     DEFAULT NULL COMMENT '富文本内容',
  `summary`      VARCHAR(500) DEFAULT NULL COMMENT '摘要',
  `category_id`  BIGINT       DEFAULT NULL COMMENT '分类ID',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'draft' COMMENT 'draft/published/unpublished',
  `is_top`       TINYINT      NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `view_count`   INT          NOT NULL DEFAULT 0 COMMENT '浏览量',
  `like_count`   INT          NOT NULL DEFAULT 0 COMMENT '点赞数',
  `favorite_count` INT        NOT NULL DEFAULT 0 COMMENT '收藏数',
  `publish_time` DATETIME     DEFAULT NULL COMMENT '发布时间（定时发布用）',
  `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`   TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_category_status` (`category_id`, `status`),
  KEY `idx_publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新闻资讯';

CREATE TABLE IF NOT EXISTS `hall` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL COMMENT '展馆名称',
  `cover`       VARCHAR(500) DEFAULT NULL COMMENT '封面图',
  `intro`       TEXT         DEFAULT NULL COMMENT '简介',
  `category_id` BIGINT       DEFAULT NULL,
  `sort`        INT          NOT NULL DEFAULT 0,
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线上展馆';

CREATE TABLE IF NOT EXISTS `hall_section` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `hall_id`     BIGINT      NOT NULL COMMENT '所属展馆',
  `title`       VARCHAR(100) NOT NULL COMMENT '章节标题',
  `sort`        INT         NOT NULL DEFAULT 0,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_hall_id` (`hall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='展馆章节';

CREATE TABLE IF NOT EXISTS `hall_media` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `hall_id`     BIGINT      NOT NULL,
  `section_id`  BIGINT      DEFAULT NULL,
  `media_type`  VARCHAR(20) NOT NULL COMMENT 'image/audio/video',
  `url`         VARCHAR(500) NOT NULL COMMENT '资源URL',
  `caption`     VARCHAR(200) DEFAULT NULL COMMENT '图说/文字说明',
  `sort`        INT         NOT NULL DEFAULT 0,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_hall_section` (`hall_id`, `section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='展馆媒体资源';

CREATE TABLE IF NOT EXISTS `craft` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL COMMENT '文创名称',
  `cover`         VARCHAR(500) DEFAULT NULL,
  `category_id`   BIGINT       DEFAULT NULL,
  `intro_zh`      TEXT         DEFAULT NULL COMMENT '中文介绍',
  `intro_en`      TEXT         DEFAULT NULL COMMENT '英文介绍',
  `model_3d_url`  VARCHAR(500) DEFAULT NULL COMMENT 'GLB 3D模型URL',
  `preview_type`  VARCHAR(20)  NOT NULL DEFAULT 'multi_image' COMMENT 'model3d/multi_image',
  `status`        TINYINT      NOT NULL DEFAULT 1,
  `sort`          INT          NOT NULL DEFAULT 0,
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`    TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文创工艺品';

CREATE TABLE IF NOT EXISTS `craft_image` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `craft_id`    BIGINT       NOT NULL,
  `image_url`   VARCHAR(500) NOT NULL,
  `angle_label` VARCHAR(50)  DEFAULT NULL COMMENT '角度标签，如：正面、侧面',
  `sort`        INT          NOT NULL DEFAULT 0,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_craft_id` (`craft_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文创多角度图片';

CREATE TABLE IF NOT EXISTS `craft_contact` (
  `craft_id`    BIGINT      NOT NULL COMMENT '文创ID（主键）',
  `phone`       VARCHAR(20) DEFAULT NULL,
  `wechat`      VARCHAR(100) DEFAULT NULL COMMENT '微信号',
  `work_wechat` VARCHAR(100) DEFAULT NULL COMMENT '企业微信',
  `email`       VARCHAR(100) DEFAULT NULL,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`craft_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文创咨询联系方式';

CREATE TABLE IF NOT EXISTS `course` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT,
  `name`             VARCHAR(200) NOT NULL COMMENT '课程名称',
  `cover`            VARCHAR(500) DEFAULT NULL,
  `category_id`      BIGINT       DEFAULT NULL,
  `target_audience`  VARCHAR(200) DEFAULT NULL COMMENT '适合人群',
  `duration_minutes` INT          DEFAULT NULL COMMENT '时长（分钟）',
  `start_time`       DATETIME     DEFAULT NULL COMMENT '开课时间',
  `intro`            TEXT         DEFAULT NULL COMMENT '课程介绍',
  `video_url`        VARCHAR(500) DEFAULT NULL COMMENT '视频URL（CDN）',
  `subtitle_url`     VARCHAR(500) DEFAULT NULL COMMENT '字幕文件URL（.vtt）',
  `subtitle_status`  VARCHAR(20)  NOT NULL DEFAULT 'none' COMMENT 'none/processing/ready/failed',
  `subtitle_task_id` VARCHAR(100) DEFAULT NULL COMMENT 'ASR任务ID',
  `status`           TINYINT      NOT NULL DEFAULT 1,
  `create_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='在线课程';

CREATE TABLE IF NOT EXISTS `resource` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(200) NOT NULL COMMENT '资源名称',
  `file_url`       VARCHAR(500) NOT NULL COMMENT '文件URL',
  `preview_url`    VARCHAR(500) DEFAULT NULL COMMENT '预览URL',
  `file_type`      VARCHAR(20)  NOT NULL COMMENT 'pdf/word/ppt/mp4/mp3等',
  `file_size_kb`   INT          DEFAULT NULL COMMENT '文件大小（KB）',
  `category_id`    BIGINT       DEFAULT NULL,
  `download_count` INT          NOT NULL DEFAULT 0,
  `status`         TINYINT      NOT NULL DEFAULT 1,
  `create_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`     TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习资源';

CREATE TABLE IF NOT EXISTS `course_resource` (
  `course_id`   BIGINT NOT NULL,
  `resource_id` BIGINT NOT NULL,
  `sort`        INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (`course_id`, `resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程-资源关联';

-- ============================================================
-- 5.3 活动与报名
-- ============================================================

CREATE TABLE IF NOT EXISTS `activity` (
  `id`                BIGINT       NOT NULL AUTO_INCREMENT,
  `title`             VARCHAR(200) NOT NULL,
  `cover`             VARCHAR(500) DEFAULT NULL,
  `intro`             TEXT         DEFAULT NULL,
  `location`          VARCHAR(200) DEFAULT NULL COMMENT '活动地点',
  `start_time`        DATETIME     DEFAULT NULL COMMENT '活动开始时间',
  `end_time`          DATETIME     DEFAULT NULL COMMENT '活动结束时间',
  `enroll_start_time` DATETIME     DEFAULT NULL COMMENT '报名开始时间',
  `enroll_end_time`   DATETIME     DEFAULT NULL COMMENT '报名截止时间',
  `quota`             INT          NOT NULL DEFAULT 0 COMMENT '名额上限（0=不限）',
  `enrolled_count`    INT          NOT NULL DEFAULT 0 COMMENT '已报名人数',
  `status`            VARCHAR(20)  NOT NULL DEFAULT 'draft' COMMENT 'draft/published/ended/cancelled',
  `need_review`       TINYINT      NOT NULL DEFAULT 0 COMMENT '是否需要审核',
  `created_by`        BIGINT       DEFAULT NULL COMMENT '创建者adminID',
  `create_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`        TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动';

CREATE TABLE IF NOT EXISTS `enroll` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `activity_id`   BIGINT       NOT NULL,
  `member_id`     BIGINT       NOT NULL,
  `name`          VARCHAR(50)  NOT NULL COMMENT '报名姓名',
  `phone`         VARCHAR(20)  NOT NULL COMMENT '联系电话',
  `college`       VARCHAR(100) DEFAULT NULL,
  `grade`         VARCHAR(20)  DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected/cancelled',
  `voucher_code`  VARCHAR(50)  DEFAULT NULL COMMENT '凭证码',
  `qr_code_url`   VARCHAR(500) DEFAULT NULL COMMENT '二维码图片URL',
  `reject_reason` VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
  `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`    TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_activity` (`member_id`, `activity_id`),
  KEY `idx_activity_id` (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名';

-- ============================================================
-- 5.4 互动行为
-- ============================================================

CREATE TABLE IF NOT EXISTS `favorite` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `member_id`   BIGINT      NOT NULL,
  `target_type` VARCHAR(30) NOT NULL COMMENT 'news/hall/craft/course/resource',
  `target_id`   BIGINT      NOT NULL,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_target` (`member_id`, `target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏记录';

CREATE TABLE IF NOT EXISTS `like_record` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `member_id`   BIGINT      NOT NULL,
  `target_type` VARCHAR(30) NOT NULL,
  `target_id`   BIGINT      NOT NULL,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_target` (`member_id`, `target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞记录';

CREATE TABLE IF NOT EXISTS `share_record` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `member_id`   BIGINT      NOT NULL,
  `target_type` VARCHAR(30) NOT NULL,
  `target_id`   BIGINT      NOT NULL,
  `platform`    VARCHAR(20) DEFAULT NULL COMMENT '分享渠道',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享记录';

CREATE TABLE IF NOT EXISTS `download_record` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`    BIGINT       NOT NULL,
  `resource_id`  BIGINT       NOT NULL,
  `file_name`    VARCHAR(200) DEFAULT NULL,
  `downloaded_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='下载记录';

CREATE TABLE IF NOT EXISTS `course_progress` (
  `id`                     BIGINT  NOT NULL AUTO_INCREMENT,
  `member_id`              BIGINT  NOT NULL,
  `course_id`              BIGINT  NOT NULL,
  `last_position_seconds`  INT     NOT NULL DEFAULT 0 COMMENT '上次播放位置（秒）',
  `total_duration_seconds` INT     NOT NULL DEFAULT 0 COMMENT '总时长（秒）',
  `progress_percent`       DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '完成百分比',
  `completed`              TINYINT NOT NULL DEFAULT 0 COMMENT '是否完成（≥90%）',
  `updated_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_course` (`member_id`, `course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程学习进度';

-- ============================================================
-- 5.5 公告
-- ============================================================

CREATE TABLE IF NOT EXISTS `announcement` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `content`     VARCHAR(500) NOT NULL COMMENT '公告内容',
  `link_url`    VARCHAR(500) DEFAULT NULL COMMENT '点击跳转链接',
  `sort`        INT          NOT NULL DEFAULT 0,
  `is_scroll`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否滚动显示',
  `start_time`  DATETIME     DEFAULT NULL COMMENT '生效时间',
  `end_time`    DATETIME     DEFAULT NULL COMMENT '失效时间',
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页公告';

-- ============================================================
-- 5.6 积分与徽章
-- ============================================================

CREATE TABLE IF NOT EXISTS `point_rule` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `action`      VARCHAR(50) NOT NULL COMMENT '触发动作标识',
  `points`      INT         NOT NULL DEFAULT 0 COMMENT '每次加分数',
  `daily_limit` INT         NOT NULL DEFAULT 1 COMMENT '每日上限次数',
  `status`      TINYINT     NOT NULL DEFAULT 1,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分规则';

CREATE TABLE IF NOT EXISTS `point_record` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`  BIGINT       NOT NULL,
  `action`     VARCHAR(50)  NOT NULL,
  `points`     INT          NOT NULL COMMENT '本次加分（正数）',
  `remark`     VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水';

CREATE TABLE IF NOT EXISTS `badge` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(50)  NOT NULL COMMENT '徽章名称',
  `icon_url`        VARCHAR(500) DEFAULT NULL,
  `description`     VARCHAR(200) DEFAULT NULL,
  `condition_type`  VARCHAR(50)  NOT NULL COMMENT '条件类型：points/enroll_count/course_count等',
  `condition_value` INT          NOT NULL DEFAULT 0 COMMENT '条件阈值',
  `status`          TINYINT      NOT NULL DEFAULT 1,
  `create_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`      TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='徽章定义';

CREATE TABLE IF NOT EXISTS `member_badge` (
  `member_id`   BIGINT   NOT NULL,
  `badge_id`    BIGINT   NOT NULL,
  `achieved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`, `badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已获徽章';

-- ============================================================
-- 5.7 订阅消息授权记录
-- ============================================================

CREATE TABLE IF NOT EXISTS `member_subscribe_record` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`       BIGINT       NOT NULL,
  `template_id`     VARCHAR(100) NOT NULL COMMENT '微信消息模板ID',
  `scene`           VARCHAR(50)  NOT NULL COMMENT '使用场景：enroll_success/activity_remind/new_course',
  `available_count` INT          NOT NULL DEFAULT 0 COMMENT '剩余可发次数',
  `authorized_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_scene` (`member_id`, `scene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅消息授权';

-- ============================================================
-- 5.8 反馈与站内消息
-- ============================================================

CREATE TABLE IF NOT EXISTS `feedback` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`   BIGINT       NOT NULL,
  `content`     TEXT         NOT NULL COMMENT '反馈内容',
  `images`      JSON         DEFAULT NULL COMMENT '图片URL列表',
  `contact`     VARCHAR(100) DEFAULT NULL COMMENT '联系方式',
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending/replied',
  `reply`       TEXT         DEFAULT NULL,
  `replied_at`  DATETIME     DEFAULT NULL,
  `replied_by`  BIGINT       DEFAULT NULL COMMENT '回复adminID',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈';

CREATE TABLE IF NOT EXISTS `message` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`    BIGINT       NOT NULL,
  `title`        VARCHAR(100) NOT NULL,
  `content`      TEXT         NOT NULL,
  `type`         VARCHAR(30)  NOT NULL COMMENT 'system/enroll/activity/course',
  `related_type` VARCHAR(30)  DEFAULT NULL,
  `related_id`   BIGINT       DEFAULT NULL,
  `read_status`  TINYINT      NOT NULL DEFAULT 0 COMMENT '0未读 1已读',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_read` (`member_id`, `read_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内消息';

-- ============================================================
-- 5.9 全局搜索索引
-- ============================================================

CREATE TABLE IF NOT EXISTS `search_index` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `target_type`  VARCHAR(30)  NOT NULL COMMENT 'news/hall/craft/course/resource',
  `target_id`    BIGINT       NOT NULL,
  `title`        VARCHAR(200) NOT NULL,
  `summary`      VARCHAR(500) DEFAULT NULL,
  `keywords`     VARCHAR(500) DEFAULT NULL,
  `cover`        VARCHAR(500) DEFAULT NULL,
  `publish_time` DATETIME     DEFAULT NULL,
  `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '1可搜索 0不可搜索',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_target` (`target_type`, `target_id`),
  FULLTEXT KEY `ft_title_summary` (`title`, `summary`) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索索引';

-- ============================================================
-- 5.10 统计
-- ============================================================

CREATE TABLE IF NOT EXISTS `event_log` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `member_id`   BIGINT      DEFAULT NULL,
  `event_type`  VARCHAR(50) NOT NULL COMMENT 'view/like/favorite/share/download/enroll/play',
  `target_type` VARCHAR(30) DEFAULT NULL,
  `target_id`   BIGINT      DEFAULT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_member_event` (`member_id`, `event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行为事件日志';

CREATE TABLE IF NOT EXISTS `stat_daily` (
  `date`         DATE   NOT NULL COMMENT '统计日期',
  `pv`           BIGINT NOT NULL DEFAULT 0 COMMENT '页面浏览量',
  `uv`           BIGINT NOT NULL DEFAULT 0 COMMENT '独立访客',
  `dau`          BIGINT NOT NULL DEFAULT 0 COMMENT '日活用户',
  `new_member`   INT    NOT NULL DEFAULT 0 COMMENT '新增用户',
  `enroll_count` INT    NOT NULL DEFAULT 0 COMMENT '报名总次数',
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日汇总统计';

CREATE TABLE IF NOT EXISTS `stat_content` (
  `date`        DATE        NOT NULL,
  `target_type` VARCHAR(30) NOT NULL,
  `target_id`   BIGINT      NOT NULL,
  `view_count`  INT         NOT NULL DEFAULT 0,
  `click_count` INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`date`, `target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容统计';

-- ============================================================
-- 5.11 学院矩阵
-- ============================================================

CREATE TABLE IF NOT EXISTS `college_app` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(100) NOT NULL COMMENT '学院名称',
  `appid`        VARCHAR(50)  DEFAULT NULL COMMENT '小程序AppID',
  `path`         VARCHAR(200) DEFAULT NULL COMMENT '跳转页面路径',
  `icon_url`     VARCHAR(500) DEFAULT NULL,
  `description`  VARCHAR(200) DEFAULT NULL,
  `sort`         INT          NOT NULL DEFAULT 0,
  `status`       TINYINT      NOT NULL DEFAULT 1,
  `content_type` VARCHAR(20)  NOT NULL DEFAULT 'manual' COMMENT 'jump/embed_h5/api_sync/manual',
  `content_url`  VARCHAR(500) DEFAULT NULL COMMENT 'H5地址或API地址',
  `api_token`    VARCHAR(200) DEFAULT NULL COMMENT '接口对接token',
  `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`   TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学院矩阵';

-- ============================================================
-- 5.12 AI 知识库
-- ============================================================

CREATE TABLE IF NOT EXISTS `knowledge_doc` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200) NOT NULL COMMENT '文档标题',
  `file_url`    VARCHAR(500) NOT NULL COMMENT '原文件OSS URL',
  `source_type` VARCHAR(20)  NOT NULL DEFAULT 'upload' COMMENT 'upload/manual',
  `char_count`  INT          DEFAULT NULL COMMENT '总字符数',
  `chunk_count` INT          DEFAULT NULL COMMENT '分段数',
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'processing' COMMENT 'processing/ready/failed',
  `uploaded_by` BIGINT       DEFAULT NULL COMMENT '上传adminID',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI知识库文档';

CREATE TABLE IF NOT EXISTS `knowledge_chunk` (
  `id`             BIGINT   NOT NULL AUTO_INCREMENT,
  `doc_id`         BIGINT   NOT NULL COMMENT '所属文档',
  `chunk_text`     TEXT     NOT NULL COMMENT '文本片段',
  `chunk_index`    INT      NOT NULL COMMENT '段落序号',
  `embedding_json` LONGTEXT DEFAULT NULL COMMENT 'Embedding向量（JSON数组）',
  `keywords`       VARCHAR(500) DEFAULT NULL COMMENT '关键词',
  `char_count`     INT      DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库分段';

CREATE TABLE IF NOT EXISTS `ai_session` (
  `id`         BIGINT   NOT NULL AUTO_INCREMENT,
  `member_id`  BIGINT   NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI会话';

CREATE TABLE IF NOT EXISTS `ai_message` (
  `id`               BIGINT      NOT NULL AUTO_INCREMENT,
  `session_id`       BIGINT      NOT NULL,
  `role`             VARCHAR(20) NOT NULL COMMENT 'user/assistant',
  `content`          TEXT        NOT NULL,
  `source_chunk_ids` JSON        DEFAULT NULL COMMENT '引用的知识库段落ID列表',
  `safety_status`    VARCHAR(20) NOT NULL DEFAULT 'pass' COMMENT 'pass/blocked',
  `token_count`      INT         DEFAULT NULL,
  `created_at`       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI会话消息';

-- ============================================================
-- 5.13 系统配置
-- ============================================================

CREATE TABLE IF NOT EXISTS `banner` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200) DEFAULT NULL COMMENT '标题',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '副标题/描述',
  `image_url`   VARCHAR(500) DEFAULT NULL COMMENT '图片URL',
  `link_type`   VARCHAR(20)  NOT NULL DEFAULT 'none' COMMENT 'none/page/url',
  `link_value`  VARCHAR(500) DEFAULT NULL COMMENT '跳转值（页面路径或URL）',
  `sort`        INT          NOT NULL DEFAULT 0,
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页轮播图';

CREATE TABLE IF NOT EXISTS `home_recommend` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `module_type` VARCHAR(30) NOT NULL COMMENT 'news/course',
  `target_id`   BIGINT      NOT NULL COMMENT '对应内容ID',
  `sort`        INT         NOT NULL DEFAULT 0,
  `status`      TINYINT     NOT NULL DEFAULT 1,
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页推荐位';

CREATE TABLE IF NOT EXISTS `nav_item` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `label`       VARCHAR(50)  NOT NULL COMMENT '导航标签',
  `icon`        VARCHAR(500) DEFAULT NULL COMMENT '图标URL',
  `path`        VARCHAR(200) NOT NULL COMMENT '跳转路径',
  `sort`        INT          NOT NULL DEFAULT 0,
  `status`      TINYINT      NOT NULL DEFAULT 1,
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted`  TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页功能入口';

CREATE TABLE IF NOT EXISTS `sys_config` (
  `config_key`   VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT         DEFAULT NULL COMMENT '配置值',
  `remark`       VARCHAR(200) DEFAULT NULL,
  `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置项';

-- ============================================================
-- 初始数据
-- ============================================================

-- 角色（超管）
INSERT IGNORE INTO `sys_role` (`id`, `role_name`, `permissions`) VALUES
(1, '超级管理员', '["admin:super","news:read","news:write","news:publish","hall:read","hall:write","course:read","course:write","enroll:read","enroll:export","stats:view"]'),
(2, '内容编辑', '["news:read","news:write","hall:read","hall:write","course:read","course:write"]'),
(3, '活动管理员', '["enroll:read","enroll:export"]');

-- 默认超管账号（密码：Admin@123，BCrypt加密）
INSERT IGNORE INTO `sys_user` (`id`, `username`, `password_hash`, `role_id`, `real_name`, `status`) VALUES
(1, 'admin', '$2a$10$hJGSAarox5iMOYI8DpsGy.THWSBVwDsvKQleMKKA2G271zQamP7gm', 1, '超级管理员', 1);

-- 积分规则
INSERT IGNORE INTO `point_rule` (`action`, `points`, `daily_limit`, `status`) VALUES
('login',          2, 1,  1),
('view_news',      1, 5,  1),
('view_hall',      2, 3,  1),
('like',           1, 10, 1),
('favorite',       2, 10, 1),
('share',          3, 3,  1),
('enroll_activity',10, 1, 1),
('complete_course', 20, 1, 1),
('download_resource', 2, 5, 1);

-- 徽章初始数据
INSERT IGNORE INTO `badge` (`name`, `icon_url`, `description`, `condition_type`, `condition_value`, `status`) VALUES
('书院入门',  NULL, '首次登录书院小程序', 'login_count', 1, 1),
('文化探索者', NULL, '累计积分达到 50 分', 'points', 50, 1),
('文化传播者', NULL, '累计积分达到 200 分', 'points', 200, 1),
('展馆达人',  NULL, '参观全部 11 个展馆', 'hall_count', 11, 1),
('学习先锋',  NULL, '完成 3 门课程学习', 'course_count', 3, 1),
('活动达人',  NULL, '参加 5 次活动', 'enroll_count', 5, 1);

-- 系统配置初始值
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `remark`) VALUES
('site_name',       '云端书院',                   '网站/小程序名称'),
('site_logo',       '',                           'Logo图片URL'),
('ai_daily_limit',  '20',                         '每用户每日AI问答次数上限'),
('ai_cache_ttl',    '86400',                      'AI答案缓存时长（秒）'),
('wx_appid',        '',                           '微信小程序AppID'),
('wx_secret',       '',                           '微信小程序Secret');

SET FOREIGN_KEY_CHECKS = 1;
