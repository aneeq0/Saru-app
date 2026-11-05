# Saru International — Web Admin Portal

Medical supply, import, tender, and inventory management platform for **Saru International Pvt. Ltd.**

React + Vite + TypeScript admin SPA. Deployed on **Vercel**. Talks to the NestJS API on **Railway**.

```
web/
├── src/                 # App source
├── vercel.json          # SPA rewrites + headers
├── .env.example         # Local
└── .env.production.example
```

## Quick start

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

Mock API mode defaults **on** in Vite DEV and **off** in production builds.

### Demo sign-in

| Email | Role | Password |
|---|---|---|
| owner@saru.demo | Owner | Demo@1234 |
| tender@saru.demo | Tender Manager | Demo@1234 |
| inventory@saru.demo | Inventory Manager | Demo@1234 |
| accounts@saru.demo | Accounts Officer | Demo@1234 |
| auditor@saru.demo | Auditor | Demo@1234 |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit/component tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm typecheck` | TypeScript project references check |

## Environment

Copy [`.env.example`](./.env.example) → `.env` for local work.

```env
VITE_API_BASE_URL=/api
VITE_ENABLE_MOCK_API=true
VITE_APP_NAME=Saru International
VITE_APP_ENV=development
```

Set `VITE_ENABLE_MOCK_API=false` when using the NestJS API. See [docs/BACKEND_INTEGRATION.md](./docs/BACKEND_INTEGRATION.md).

### Vercel production

Root Directory = `web`. Set build-time env from [`.env.production.example`](./.env.production.example):

```env
VITE_API_BASE_URL=https://your-api.up.railway.app/api
VITE_SOCKET_URL=https://your-api.up.railway.app
VITE_ENABLE_MOCK_API=false
VITE_APP_ENV=production
```

Full steps: [`../docs/deploy/VERCEL.md`](../docs/deploy/VERCEL.md).

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API contract assumptions](./docs/API_CONTRACTS.md)
- [Feature implementation status](./docs/FEATURE_STATUS.md)
- [Backend integration](./docs/BACKEND_INTEGRATION.md)
- [Continuation plan](./docs/CONTINUATION_PLAN.md)
- [Deploy overview](../docs/deploy/OVERVIEW.md)

## Design

Branded enterprise UI using navy `#102A43`, sidebar `#0B1F33`, teal `#0F766E`, and calm semantic status colors. See tokens in `src/styles/index.css`.

## Scope boundaries

- Not a retail e-commerce storefront
- No shopping cart / public checkout
- Backend is authoritative for stock, finance, and approvals
- Mock data is demonstration-only and never silently used when the real API fails
