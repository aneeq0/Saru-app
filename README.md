# Saru International Platform

Monorepo for Saru International Pvt. Ltd. — medical supply, import, tender, and inventory management.

| Package | Path | Stack | Host |
|---|---|---|---|
| **Web Admin Portal** | [`web/`](./web) | React + Vite + TypeScript | **Vercel** |
| **Backend API** | [`backend/`](./backend) | NestJS + PostgreSQL + Prisma + Redis | **Railway** |
| **Mobile Application** | [`mobile/`](./mobile) | React Native + Expo + TypeScript | Expo / stores |

```
Saru-app/
├── backend/          # Railway service root (Dockerfile + railway.toml)
├── web/              # Vercel project root (vercel.json)
├── mobile/
└── docs/deploy/      # Production wiring (CORS, cookies, env)
```

Deploy guides: [`docs/deploy/OVERVIEW.md`](./docs/deploy/OVERVIEW.md) · [Railway](./docs/deploy/RAILWAY.md) · [Vercel](./docs/deploy/VERCEL.md)

## Web Admin Portal (Vercel)

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Demo: `owner@saru.demo` / `Demo@1234`

Production: set Root Directory to `web`, configure `VITE_*` from [`web/.env.production.example`](./web/.env.production.example). See [`web/README.md`](./web/README.md).

## Backend API (Railway)

```bash
cd backend
docker compose up -d postgres redis
pnpm install
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm build:api && pnpm start:api
```

- API: [http://localhost:3000/api](http://localhost:3000/api)
- OpenAPI: [http://localhost:3000/docs](http://localhost:3000/docs)
- Demo: `owner@saru.demo` / `Demo@1234`
- Postgres host port: **5433** (avoids local Postgres conflicts)

Production: set Root Directory to `backend`, add Postgres + Redis plugins, set `WEB_ORIGIN` to the Vercel URL and cookie flags for cross-site sessions. See [`backend/README.md`](./backend/README.md).

## Mobile Application

```bash
cd mobile
pnpm install
pnpm start
```

Demo accounts match the web portal. See [`mobile/README.md`](./mobile/README.md).

## Integration

Status and contracts: [`backend/docs/IMPLEMENTATION_STATUS.md`](./backend/docs/IMPLEMENTATION_STATUS.md), [`backend/docs/api/INTEGRATION.md`](./backend/docs/api/INTEGRATION.md), [`web/docs/API_CONTRACTS.md`](./web/docs/API_CONTRACTS.md).

**Full-stack live sync:** [`docs/integration/FINAL_INTEGRATION_REPORT.md`](./docs/integration/FINAL_INTEGRATION_REPORT.md) · Socket.IO path `/socket.io` namespace `/realtime` · disable client mocks to use the shared API.
