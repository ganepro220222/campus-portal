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

**Dev login:** student `2021001` / password `Admin@123`. WeChat login works in dev mode without AppID.

**Logs:** `docker compose -f docker-compose.dev.yml logs -f backend`

## Local dev (without Docker backend)

Requires JDK 17+ on the host. Start only infra with compose, then `mvn spring-boot:run` in `backend/` (profile `dev`). Load seed manually if needed: `mysql ... < sql/seed-dev.sql`.

## License

Private. All rights reserved.
