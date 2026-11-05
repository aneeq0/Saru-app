# Integration Test Results

**Environment:** local macOS · Postgres `localhost:5433` · Redis `localhost:6379` · API `http://127.0.0.1:3000`  
**Date:** 2026-10-29  
**Harness:** live Node smoke script against running NestJS build (not mocks)

## Results

| # | Scenario | Status | Notes |
|---|---|---|---|
| 1 | Mobile login issues Bearer token | **PASS** | `POST /api/auth/mobile/login` |
| 2 | Dashboard aggregate payload | **PASS** | `GET /api/dashboard` returns `kpis` |
| 3 | Inventory stock alias | **PASS** | `GET /api/inventory/stock` |
| 4 | Product create persists | **PASS** | `POST /api/products` → 201 |
| 5 | Outbox → change feed | **PASS** | `product.created` visible on `/sync/changes` ≈ **2915 ms** (publisher poll ≤750ms + batch) |
| 6 | Socket.IO auth handshake | **PASS** | `auth.token` → `realtime:ready` |
| 7 | Live socket event delivery | **PASS** | commit→socket ≈ **694 ms** for `product.created` |
| 8 | Unauthorized record subscribe | **PASS** | inventory user → Invoice room → `FORBIDDEN` |

**Summary: 8/8 PASS** for the executed automated smoke suite.

## Not yet automated in this run

| Scenario | Status | Reason |
|---|---|---|
| Test B Goods receiving E2E | **BLOCKED** | Needs scripted multi-step receipt/post + dual clients |
| Test C Tender checklist | **PARTIAL** | Outbox on create; checklist events not fully expanded |
| Test D Delivery double-dispatch | **PARTIAL** | Backend rejects duplicate dispatch; dual-client UI not scripted |
| Test E Payment unauthorized payload | **PARTIAL** | Room auth covered; payment outbox fan-out incomplete |
| Test F Approval mobile/web | **PARTIAL** | Outbox on decide; dual UI not scripted |
| Test G Offline draft apply | **NOT IMPLEMENTED** | Ops accepted; worker apply pipeline pending |
| Test H Reconnect miss-feed | **PARTIAL** | API exists; dedicated disconnect/reconnect automation pending |
| Test J Multi-instance Redis fan-out | **PARTIAL** | Adapter wired; dual Nest processes not launched in this run |
| Web Playwright live sync | **NOT RUN** | Requires `VITE_ENABLE_MOCK_API=false` + browser harness |
| Mobile Maestro | **NOT RUN** | Framework not present |
| Expo push delivery | **NOT IMPLEMENTED** | Token register only |

## Measured latency (this environment)

| Metric | Value |
|---|---|
| Commit → Socket.IO visible (`product.created`) | ≈ **0.7 s** |
| Commit → `/sync/changes` visible | ≈ **2.9 s** |
| Target band (prompt) | 1–3 s under normal test conditions |

These are single-run local measurements, not SLOs.
