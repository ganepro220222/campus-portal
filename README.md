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

## Local dev

1. Start infra: `docker compose -f docker-compose.dev.yml up -d`
2. Run backend from `backend/` (profile: `dev`)
3. Open `miniapp/` in WeChat DevTools

## License

Private. All rights reserved.
