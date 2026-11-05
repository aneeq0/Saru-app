# Saru International — Initial Integration Audit

**Date:** 2026-10-29  
**Scope:** `web/`, `mobile/`, `backend/` (monorepo at repository root)  
**Auditor role:** Full-stack integration (API contracts, auth, realtime readiness)

---

## 1. Project paths

| Application | Path | Package |
|---|---|---|
| React Web Admin Portal | `web/` | `saru-international-admin@0.1.0` |
| React Native Expo Mobile | `mobile/` | Expo app under `mobile/` |
| NestJS Backend | `backend/` | `@saru/api@0.0.1` + `@saru/database@0.1.0` |

Workspace layout: single git monorepo. Backend is itself a pnpm workspace (`apps/*`, `packages/*`).

---

## 2. Framework versions

| Layer | Stack | Versions (declared / resolved) |
|---|---|---|
| Web | React + Vite + TypeScript | React 19.1, Vite 6.3, TanStack Query 5.80, React Router 7.6 |
| Mobile | Expo + RN + TypeScript | Expo ~58.0, RN 0.88.1, React 19.3, TanStack Query 5.105 |
| Backend | NestJS + Prisma + PostgreSQL | NestJS 11.2.8, Prisma 6.19, PostgreSQL 16 (Docker), Redis 7 (Docker) |

---

## 3. API origins & versions

| Client | Config key | Default | Mock default |
|---|---|---|---|
| Web | `VITE_API_BASE_URL` | `http://localhost:3000/api` | `VITE_ENABLE_MOCK_API=true` |
| Mobile | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3000/api` | `EXPO_PUBLIC_ENABLE_MOCK_API=true` |
| Backend | `API_BASE_PATH` | `api` → `/api/*` | N/A |

**API versioning:** Path is `/api` (not `/api/v1`). Mobile `env.apiVersion` is informational only.

**OpenAPI:** Swagger at `http://localhost:3000/docs` (version `0.1.0`). No generated shared TypeScript client package yet.

---

## 4. Authentication methods

| Channel | Login | Credential transport | Refresh |
|---|---|---|---|
| Web | `POST /api/auth/login` | HttpOnly `saru_session` + `saru_refresh`; readable `XSRF-TOKEN` | `POST /api/auth/web/refresh` |
| Mobile | `POST /api/auth/mobile/login` **or** `/auth/login` + `X-Client: mobile` | Bearer `accessToken` + body `refreshToken` | `POST /api/auth/mobile/refresh` |

Shared: `GET /api/auth/session`, logout, Argon2id passwords, RBAC via `@RequirePermissions`, session revoke on password reset.

**Findings:**
- Web client uses cookies correctly (`credentials: 'include'`). CSRF header is sent; **backend does not yet enforce CSRF**.
- Mobile login currently calls `/auth/login` **without** `X-Client: mobile` → receives cookie-style response (no tokens) when talking to real API — **FAIL**.
- Mobile has no refresh-token rotation client logic yet — **PARTIAL**.

Demo: `owner@saru.demo` / `Demo@1234` (and role-specific `*@saru.demo` accounts).

---

## 5. Database entities (authoritative)

Prisma schema: `backend/packages/database/prisma/schema.prisma`.

Domain coverage: Users/Roles/Permissions, Products/Variants, Inventory (balances, lots, movements, reservations), Imports/Receipts, Tenders/Contracts/Securities, Deliveries, Invoices/Payments, Documents, Approvals, Notifications, DevicePushTokens, **OutboxEvent**, **SyncOperation**, IdempotencyRecord, AuditEvent.

**Single source of truth:** PostgreSQL via NestJS services. Frontends must not invent stock/finance balances.

---

## 6. Socket / Redis / BullMQ status

| Capability | Status |
|---|---|
| Socket.IO gateway | **Missing** at audit time (implementation started in this integration pass) |
| Redis in Docker | Present (`6379`); `REDIS_URL` in env |
| ioredis / BullMQ in app runtime | Dependencies installed; **unused in source** at audit time |
| Outbox table | Present; producers only on goods-receipt post + dispatch stock-out |
| Outbox consumer / publisher | **Missing** at audit time |
| `GET /sync/changes` | **Missing** (only offline op accept/status) |
| Expo push delivery | Token register API only; no send worker |

---

## 7. Environment variables

### Backend (`.env.example`)
`NODE_ENV`, `PORT`, `API_BASE_PATH`, `DATABASE_URL`, `REDIS_URL`, JWT secrets/TTLs, `WEB_ORIGIN`, cookie names, S3/MinIO, `LOG_LEVEL`.

### Web
`VITE_API_BASE_URL`, `VITE_ENABLE_MOCK_API`, `VITE_APP_NAME`, `VITE_APP_ENV`. **No socket URL** at audit time.

### Mobile
`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_ENABLE_MOCK_API`. **No socket URL** at audit time. Physical devices cannot use `localhost` for the API host.

---

## 8. Mock mode

Both clients ship with **mock API enabled by default**. Live integration requires:

1. Backend running with Postgres (+ Redis for realtime).
2. Web: `VITE_ENABLE_MOCK_API=false`.
3. Mobile: `EXPO_PUBLIC_ENABLE_MOCK_API=false` and LAN/staging API URL.

Mocks must never be treated as production authority.

---

## 9. Notification providers

| Channel | Status |
|---|---|
| In-app (PostgreSQL `Notification`) | REST list/read; create-on-event incomplete |
| Expo push | Plugin + token endpoints; **no delivery** |
| Email | Not implemented |
| Realtime bell/badge | Web badge hardcoded; mobile unread via REST only |

---

## 10. Test infrastructure

| App | Unit | E2E / integration |
|---|---|---|
| Backend | Jest; 1 math unit test; stale scaffold e2e | Concurrent/stock integration **TODO** |
| Web | Vitest (permissions, format, ProtectedRoute) | Playwright auth only |
| Mobile | Jest permissions only | Maestro planned, not present |

---

## 11. Critical contract mismatches (audit)

| Frontend call | Backend reality | Impact |
|---|---|---|
| `GET /inventory/stock` | `GET /inventory/balances` | Stock lists fail |
| `GET /dashboard` | `GET /dashboard/summary` (+ alerts/tasks/charts) | Dashboard shape mismatch |
| `GET /products/barcode/:code` (mobile) | `GET /products/lookup/barcode/:code` | Barcode scan fails |
| `GET /tasks` | Approvals/`dashboard/tasks` | Tasks empty/fail |
| Mobile login without `X-Client` | Cookie channel | No Bearer tokens |
| Many simple-resource GETs (`/inventory/transfers`, `/settings/roles`, …) | Not implemented | PARTIAL / NOT IMPLEMENTED |
| Mark notification read | Backend `POST …/read`; mobile `PATCH …/read` | Method mismatch |

---

## 12. Realtime gaps (priority)

1. Shared typed event envelope + constants.
2. Expand transactional outbox writes across domains.
3. Outbox publisher → Socket.IO `/realtime` + Redis adapter.
4. Authenticated subscriptions / rooms.
5. `GET /sync/changes?cursor=` reconciliation.
6. Web + mobile single-session socket clients + TanStack invalidation.
7. Durable notifications + optional Expo push worker.
8. Multi-instance + reconnect tests.

---

## 13. Verdict

All three applications are present and REST-shaped around a shared Nest/Prisma backend. **They are not yet a unified live platform:** mock-on-by-default clients, path/auth mismatches, and no Socket.IO / outbox consumer / change-feed. Schema and Docker already anticipate outbox, notifications, Redis, and sync ops — implementation must wire those layers rather than invent a second system.
