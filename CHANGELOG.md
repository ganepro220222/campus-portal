# 更新日志

本文件记录云端书院项目的重要变更，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 已完成（文档此前仍标「计划中」，2026-08-30 更正）
- staging 部署与压测终验（2026-08-27，`docs/perf/压测报告_20260827.md`；报名 PASS，浏览 P95 WARN）
- 备份恢复演练记录（2026-08-27，`docs/运维/备份恢复说明_V1.0.md` §6.3）
- 预发 HTTPS 过渡域 `https://api.yunmanvr.com`（ECS `47.109.0.192`，证书已配，health/admin 可访问）
- 微信服务器域名：request/uploadFile → `api.yunmanvr.com`；downloadFile → 成都 OSS 原站 + `cdn.yunmanvr.com`
- 微信业务域名：`a28c11ea.720roma.com`、`2e6zb07zn85.720yun.com`、`www.yunmanvr.com`
- 订阅模板 `WX_TMPL_ENROLL_SUCCESS` / `WX_TMPL_ENROLL_APPROVED` 已在预发生效（不含活动提醒）
- OSS + CDN：`cdn.yunmanvr.com` 反代私有桶 `yunman-shuyuan`；后台 `OSS_CDN_DOMAIN` 已注入；微信 downloadFile 已加 CDN
- ECS 工作台 100 个展品资产同步至 OSS，`config.json` 模型/全景/海报改为 CDN 地址（合伙人 TinyManager 观看机不迁）
- 工作台列表封面兼容 CDN 绝对 URL（避免拼成 `craft-001/https://…`）
- ASR 字幕对接修正：SubmitTask 改为官方 `Task` JSON（filetrans 4.0）、查询结果兼容对象 `Result`、FileLink 用 OSS 签名原站（不改写 CDN）；管理端展示最近失败原因

### 计划中
- 真机双端测试报告（体验版 + 4G；过渡域已可测）
- 专用小程序域名 ICP 通过后切域（Nginx / 证书 / `env.js` prod / 合法域名 / CORS）
- 切 prod profile 并跑 `check:release-all`

### 本地收尾（2026-07-11 续）
- 运维手册 / Runbook（`docs/运维/运维手册_V1.0.md`）
- E2-1 告警：健康探活 + 5xx 错误率 Webhook（默认关闭，`ALERT_ENABLED` 开启）
- `HealthProbeService` 抽取；`scripts/export-openapi.ps1` 归档 OpenAPI JSON
- 管理员手册 §13 同步「关联小程序」
- 单测增至 124 项（ApiErrorMetrics、OpsAlert、AlertWebhook）

---

## [0.9.0-rc] — 2026-07-11

### 新增
- 浏览量 Redis 计数 + 30 分钟去重 + 5 分钟落库（`ViewCountService`）
- `search_index` 每日全量同步兜底（`SearchIndexSyncService.syncAllPublished`）
- AI 问答配额接口 `GET /api/v1/ai/chat/quota`，问答响应含 `remainingToday`
- 悬浮「书院文化助手」对接后端 RAG，显示今日剩余次数
- 交付物文档：账号交接说明、备份恢复说明、正式测试报告
- 展馆 VR：校园安全教育馆、西部山区安全警示教育基地链接补全

### 变更
- 管理后台「Banner 管理」展示文案改为「首页轮播」
- 小程序 mock 门禁全量扫描 + `test:mock-guard` 脚本
- 管理端新闻/展馆/课程列表拆分为 composable + 编辑弹窗

### 修复
- 消除 16 个小程序页面静默 mock 回退
- 悬浮 AI 打开时配额接口 500（Docker 未重建 + silent 请求）
- 后台表格截断、编辑器弹层、日期区间、展馆阅读进度等 UI 问题

### 测试
- 后端单测 115 项通过（含 Point、EventLog、ViewCount、SearchIndex、AiChat 配额等）
- CI：backend test + admin build + miniapp mock guard

---

## [0.8.0] — 2026-07-08 ~ 07-09

### 新增
- Phase 7 AI 文化问答后端 MVP + 管理端知识库页
- 订阅消息逻辑骨架 + 消息中心（列表、已读、角标）
- 展馆语音讲解（`InnerAudioContext`）
- E2-2 操作审计日志、E2-4 OpenAPI/Swagger、E2-3 接口限流
- 微信登录 code2session（dev-mode / 生产可切换）

### 文档
- 部署手册 V1.0、管理员操作手册 V1.0
- dev 压测报告归档（报名 50 并发不超卖 PASS）

---

## [0.7.0] — 2026-07-07

### 新增
- OSS 上传主链、课程真播放、统计看板
- 压测脚本 `load:enroll` / `load:browse`
- E1 工程化：CI、health、traceId、mock 门禁骨架

---

## [0.1.0] — 2026-07-04 前

### 新增
- 微信小程序 + Spring Boot 后端 + Vue 3 管理后台基础骨架
- 新闻、展馆、文创、课程、资源、活动报名、个人中心等核心模块
- Docker Compose 本地开发环境（MySQL + Redis + Backend）
