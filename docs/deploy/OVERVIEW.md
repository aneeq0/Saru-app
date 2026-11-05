# Deployment overview

Saru is a **multi-package monorepo** with independent deploy targets:

```
Saru-app/
├── backend/     → Railway  (NestJS API + Postgres + Redis)
├── web/         → Vercel   (React admin SPA)
├── mobile/      → Expo / stores (unchanged by this split)
└── docs/deploy/ → this guide
```

```
┌────────────────────┐         HTTPS + cookies          ┌────────────────────┐
│  Vercel            │  ───────────────────────────────▶│  Railway           │
│  web/ (Vite SPA)   │  Socket.IO /socket.io /realtime  │  backend/ (Nest)   │
│  *.vercel.app      │◀─────────────────────────────────│  *.up.railway.app  │
└────────────────────┘                                   │         │          │
                                                         │    Postgres        │
                                                         │    Redis           │
                                                         └────────────────────┘
```

## Why separate hosts

| Concern | Platform |
|---|---|
| Long-running Node API, WebSockets, workers | **Railway** |
| Static SPA with global CDN + previews | **Vercel** |
| Managed Postgres + Redis next to the API | **Railway plugins** |

## Required cross-wiring

1. **Vercel** env: `VITE_API_BASE_URL` → `https://<railway-host>/api`
2. **Vercel** env: `VITE_SOCKET_URL` → `https://<railway-host>`
3. **Vercel** env: `VITE_ENABLE_MOCK_API=false`
4. **Railway** env: `WEB_ORIGIN` → `https://<vercel-host>` (comma-separated if multiple)
5. **Railway** env: `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=none`

Cross-site cookies only work with `SameSite=None; Secure`. See [RAILWAY.md](./RAILWAY.md) and [VERCEL.md](./VERCEL.md).

## Local development (unchanged)

Keep using mocks or local Docker Compose + Vite proxy. You do **not** need Railway/Vercel for day-to-day feature work.
