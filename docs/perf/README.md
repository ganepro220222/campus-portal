# 压测说明

> 对应《交付物与验收标准 V1.2》§五、《工程化与准生产增强方案 V1.1》E3-1 与上线门禁。

## 1. 环境准备

```bash
# 启动依赖（项目根目录）
docker compose -f docker-compose.dev.yml up -d

# 初始化 + 演示数据 + 压测账号
mysql -uroot -pdev123456 shuyuan < sql/init.sql
mysql -uroot -pdev123456 shuyuan < sql/seed-dev.sql
mysql -uroot -pdev123456 shuyuan < sql/patch-loadtest.sql

# 启动后端（JDK 17）
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

压测账号：`loadtest001` … `loadtest050`，密码 `Admin@123`。  
压测活动：`activity_id = 99`，名额 **50**。

## 2. 脚本

| 脚本 | 验收项 | 命令 |
|------|--------|------|
| `scripts/load/enroll-concurrent.mjs` | 50 并发报名不超卖 | `node scripts/load/enroll-concurrent.mjs` |
| `scripts/load/browse-load.mjs` | 200 并发浏览 P95 | `CONCURRENCY=200 node scripts/load/browse-load.mjs` |

环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `BASE_URL` | `http://localhost:8080` | 后端地址 |
| `ACTIVITY_ID` | `99` | 压测活动 ID |
| `CONCURRENCY` | `50` / `200` | 并发数 |
| `P95_TARGET_MS` | `500` | 浏览 P95 目标（毫秒） |

或使用 npm 脚本（项目根目录）：

```bash
npm run load:enroll
npm run load:browse
```

## 3. 报告归档

执行后将终端输出填入 `docs/perf/压测报告_YYYYMMDD.md`（可复制 `压测报告_模板.md`）。

正式验收建议在 **staging** 环境复测并注明机器规格（与《资源配置清单》一致）。

**说明：** 本地 dev + Docker 上 200 并发 P95 可能高于 500ms，属预期；脚本路径已与真实 API 对齐（`/home/recommends`、`/announcements/active`）。报名脚本登录字段为 `studentNo`（与小程序一致）。
