# Saru International — Backend API

NestJS + PostgreSQL + Prisma + Redis monorepo workspace. Deployed on **Railway**.

```
backend/
├── apps/api/              # NestJS HTTP + Socket.IO API
├── packages/database/     # Prisma schema, migrations, seed
├── Dockerfile             # Production image
├── railway.toml           # Railway build/deploy
└── docker-compose.yml     # Local Postgres + Redis (+ MinIO)
```

## Local

```bash
pnpm install
pnpm dev:infra
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm build:api && pnpm start:api
```

Copy [`.env.example`](./.env.example) → `.env` (and optionally `apps/api/.env`).

## Railway

1. Root Directory = `backend`
2. Build uses `Dockerfile` / `railway.toml`
3. Attach Postgres + Redis
4. Set production env (especially `WEB_ORIGIN`, `SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_SAMESITE=none`)
5. Start command runs migrations then the API: `pnpm start:railway`

Full steps: [`../docs/deploy/RAILWAY.md`](../docs/deploy/RAILWAY.md)

## Health

| Endpoint | Purpose |
|---|---|
| `GET /api/health/live` | Process up (Railway healthcheck) |
| `GET /api/health/ready` | DB reachable |

## Scripts

| Command | Description |
|---|---|
| `pnpm build:api` | Compile Nest API |
| `pnpm start:api` | Run compiled API |
| `pnpm start:railway` | Migrate + start (production) |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:deploy` | Apply migrations |
| `pnpm prisma:seed` | Seed demo users/data |
| `pnpm docker:build` | Build the production image locally |
