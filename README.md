# Campus Portal

Private monorepo for a campus mini program and its backend services.

## Stack

- WeChat Mini Program
- Spring Boot 3 (Java 17)
- MySQL 8, Redis 7
- Docker Compose (local dev)

## Layout

```
backend/     API service
miniapp/     Mini program client
admin/       Vue 3 management console
sql/         Database schema
docs/        Internal specs
```

## Local dev (Docker — no local JDK 17 required)

1. Start MySQL, Redis, and backend:

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

2. Wait until backend is healthy (first build may take several minutes):

   ```bash
   curl http://localhost:8080/api/v1/health
   ```

3. Open `miniapp/` in WeChat DevTools (`baseUrl` is already `http://localhost:8080/api/v1`).

**Fresh DB:** `init.sql` + `seed-dev.sql` run automatically on first `mysql_data` volume creation.

**Reset DB (re-run seed):**

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

`seed-dev.sql` 已包含 `SET NAMES utf8mb4`，避免中文乱码。若仍出现乱码（全站标题变成 `ä¸­åŽ` 这类字符），在**不删库**的情况下可执行修复脚本：

```bash
type sql\patch-fix-charset.sql | docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -pdev123456 --default-character-set=utf8mb4 shuyuan
docker compose -f docker-compose.dev.yml restart backend
```

然后在微信开发者工具中 **编译 → 清缓存 → 重新编译**，各 Tab 页下拉刷新。

**Dev login:** student `2021001` / password `Admin@123`. Admin console `admin` / `Admin@123`. WeChat login works in dev mode without AppID.

**Login lock (§2.1):** 5 consecutive wrong passwords lock the account for 5 minutes (Redis). Clear dev locks: `docker exec shuyuan-redis-1 redis-cli -a dev123456 KEYS "login:*"`.

**Logs:** `docker compose -f docker-compose.dev.yml logs -f backend`

## Admin console (Vue 3)

Requires Node.js 18+. Backend must be running on port 8080.

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:5173 — login `admin` / `Admin@123`.

Vite dev server proxies `/api` to `http://localhost:8080`. Production build: `npm run build` → static files in `admin/dist/`.

## Local dev (without Docker backend)

Requires JDK 17+ on the host. Start only infra with compose, then `mvn spring-boot:run` in `backend/` (profile `dev`). Load seed manually if needed: `mysql ... < sql/seed-dev.sql`.

## 相关文档

- [环境变量说明](docs/运维/环境变量说明.md)
- [部署手册 V1.0](docs/运维/部署手册_V1.0.md)
- [管理员操作手册 V1.0](docs/运维/管理员操作手册_V1.0.md)

## License

Private. All rights reserved.
