# Saru International Backend — Implementation Status

Last updated: 2026-10-29

## Running locally

```bash
cd backend
docker compose up -d postgres redis
cp .env.example .env   # if needed; Postgres is on host port 5433
cd packages/database && pnpm exec prisma migrate deploy && pnpm exec tsx prisma/seed.ts
cd ../../apps/api && pnpm start:dev
```

- API: `http://localhost:3000/api`
- OpenAPI: `http://localhost:3000/docs`
- Demo login: `owner@saru.demo` / `Demo@1234`

## Completed vertical slices

| Area | Status | Notes |
|------|--------|-------|
| Nest monorepo + Docker Compose | Done | Postgres 5433, Redis 6379, MinIO optional |
| Prisma schema + migration | Done | Full domain models in `packages/database` |
| Seed data | Done | Roles, permissions, demo users, catalogue, sample SHP/TND |
| Auth (web cookie + mobile bearer) | Done | Argon2id, refresh rotation, session revoke |
| RBAC guards | Done | `module:action` permissions |
| Products + catalogue | Done | Categories, manufacturers, suppliers, departments |
| Imports + goods receipts | Done | Partial receipts; transactional `post` with stock ledger |
| Inventory ledger + FOR UPDATE | Done | `postStockIn` / `postStockOut` concurrency-safe |
| Tenders → award → contract | Done | Partial awards supported |
| Contracts fulfilment | Done | Remaining qty derived from lines |
| Securities / CDR | Done | Release request/confirm transitions |
| Deliveries | Done | Draft does not deduct stock; confirm-dispatch posts once |
| Invoices | Done | Finalize writes immutable `InvoiceVersion` snapshot |
| Payments + receivables | Done | Partial allocation with over-allocation checks |
| Approvals / notifications / sync / documents | Baseline | Working endpoints; push delivery adapter pending |
| Dashboard / health | Done | |
| OpenAPI Swagger | Done | `/docs` |
| Worker (BullMQ) | Pending | Package present; dedicated worker app not yet scaffolded |
| Expo push delivery | Pending | Token registration exists |
| PDF/Excel generation | Pending | Invoice PDF returns snapshot placeholder |
| Frontend client SDK + wire-up | Pending | Contract aligned to `/api` + `{data,meta}` |
| k6 load tests | Pending | |
| CI/CD | Pending | |

## Frontend contract alignment

Both React web and Expo mobile expect:

- Base path: `/api` (not `/api/v1`)
- Auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`
- Lists: `{ data, meta: { page, pageSize, total, totalPages, hasNextPage, hasPreviousPage } }`
- Permissions: `products:view` style strings
- Demo credentials: `*@saru.demo` / `Demo@1234`

Mobile-specific: `POST /auth/mobile/login|refresh|logout` with Bearer tokens.

## Known limitations

1. Number sequences issued inside nested inventory transactions use a separate Prisma transaction (acceptable for MVP; should use the same `tx` client later).
2. Document upload returns a constructed MinIO URL; malware scan / signed URL AWS SDK hardening pending.
3. Real-time SSE/WebSocket not yet implemented.
4. Multi-tenancy intentionally out of scope (single Saru company platform).
5. 3–4M concurrent users is a planning target only — no fabricated load-test claims.

## Continuation plan

1. Scaffold `apps/worker` with BullMQ outbox consumer + notification jobs.
2. Generate OpenAPI TypeScript clients into `packages/contracts`.
3. Point web `VITE_ENABLE_MOCK_API=false` and mobile env at this API; run cross-app scenarios 1–10.
4. Add integration tests (receipt post, concurrent dispatch, payment allocate).
5. Add k6 baselines and CI workflow.
