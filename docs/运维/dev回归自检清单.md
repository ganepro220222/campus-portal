# 云端书院 · dev 环境回归自检清单

> 用途：无云、无甲方资料阶段，每次合并 `main` 或发版前 **15–30 分钟** 快速回归。  
> 环境：`docker compose -f docker-compose.dev.yml up -d` + 管理后台 `npm run dev` + 微信开发者工具。

## 0. 自动化（必须先绿）

```bash
cd backend && mvn test
cd admin && npm run typecheck && npm run build
cd .. && npm run test:mock-guard && npm run check:prod-mock
# 发布前额外执行（尚未接入 CI）：
# npm run check:release-env
```

- [ ] 三项全部通过

> **2026-07-12 自动化实测：** `mvn test` 147 passed · admin typecheck+build OK · mock-guard OK

## 1. 健康与基础

- [ ] `GET http://localhost:8080/api/v1/health` → `status=UP`，`db`/`redis`=UP
- [ ] 管理后台 `http://localhost:5173` 可登录 `admin` / `Admin@123`
- [ ] 小程序编译无报错，首页可加载

## 2. 登录与安全

- [ ] 学号登录 `2021001` / `Admin@123` 成功
- [ ] 错误密码 5 次后锁定提示（可选：清 Redis `login:*` 后重测）
- [ ] 未登录可浏览新闻/展馆列表；收藏/报名跳转登录

## 3. 小程序核心链路

| 模块 | 检查点 | ✓ |
|------|--------|---|
| 首页 | Banner、推荐、公告、搜索入口 | |
| 新闻 | 列表、详情、点赞/收藏 | |
| 展馆 | 11 馆列表；有 VR 的馆可点「进入 VR」 | |
| 课程 | 列表、详情、播放器、进度上报 | |
| 活动 | 报名、名额满提示 | |
| 个人中心 | 收藏/报名/足迹/消息/徽章 | |
| AI 助手 | 悬浮入口打开；副标题显示剩余次数；提问有回复 | |
| 关联小程序 | 列表页可打开（演示数据） | |

## 4. 管理后台

| 模块 | 检查点 | ✓ |
|------|--------|---|
| 新闻 | 新建草稿 → 发布 → 小程序可见 | |
| 展馆 | 编辑 VR 链接保存成功 | |
| 首页轮播 | 新建/上架 | |
| AI 知识库 | 录入资料 → 状态「已就绪」 | |
| 统计看板 | 图表渲染、无 JS 报错 | |
| 操作日志 | 发布后有一条记录 | |

## 5. API 抽测（可选）

Swagger：`http://localhost:8080/swagger-ui.html`

- [ ] `GET /api/v1/news` 有数据
- [ ] `GET /api/v1/halls` 11 条
- [ ] `GET /api/v1/ai/chat/quota`（带 token）返回 `remaining`
- [ ] 报名接口满员时返回业务错误码（非 500）

## 6. 已知 dev 限制（不算 FAIL）

- 微信订阅消息不会真发到手机（无模板 ID）
- AI 无 Key 时为知识库片段兜底回答
- 压测 P95 仅在 dev 单机测过，不作正式验收
- OSS 大文件可能走公开 URL 或手填链接

---

*修订：2026-07-11 初稿*
