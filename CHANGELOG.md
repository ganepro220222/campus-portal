# 更新日志

本文件记录云端书院项目的重要变更，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- staging 部署与压测终验
- 真机双端测试报告
- 备份恢复演练记录

### 本地收尾（2026-07-11）
- dev 回归自检清单、甲方配合事项清单、Apifox 回归测试清单
- 隐私政策/用户协议占位页（`packageC/legal/privacy`）
- 「学院矩阵」UI 统一改为「关联小程序」
- AI 知识库演示 seed（阳明心学、云端书院简介）
- `PointServiceTest`、`EventLogServiceTest`

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
