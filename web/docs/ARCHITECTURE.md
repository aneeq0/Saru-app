# Architecture — Saru International Web Admin Portal

## Overview

React + Vite + TypeScript frontend for Saru International’s medical supply, import, tender, and inventory operations. This application shares contracts with the NestJS backend and the React Native mobile app. It does **not** own business truth for stock, finance, or approvals.

## Stack

| Concern | Choice |
|---|---|
| UI | React 19, Tailwind CSS 4, Radix/shadcn-style primitives |
| Routing | React Router 7 (lazy feature routes) |
| Server state | TanStack Query |
| Tables | TanStack Table + URL-synced filters |
| Client UI state | Zustand (auth/session UI + shell only) |
| Forms | React Hook Form + Zod |
| HTTP | Fetch wrapper (`src/services/api/client.ts`) with cookie credentials |
| Mocks | MSW (`VITE_ENABLE_MOCK_API=true`) |
| Charts | Recharts (lazy via route chunk) |
| Tests | Vitest + Testing Library + Playwright |

## Folder structure

```
src/
  app/           providers, router, layouts, config
  components/    ui, shared, data-table, charts, forms, feedback
  features/      domain modules (pages, hooks, api, schemas)
  services/      api client, auth, files
  hooks/         cross-cutting hooks
  lib/           utils, format, permissions
  types/         shared contracts
  mocks/         MSW handlers + demo datasets
  styles/        design tokens
  test/          test setup
```

## Design tokens

Brand tokens live in `src/styles/index.css` (`@theme`). Components must use semantic classes (`bg-navy`, `text-teal`, `border-border`) rather than scattered hex values.

## Auth & permissions

- Prefer HttpOnly cookie sessions (production). Mock mode simulates session via MSW.
- Permissions are granular (`module:action`), not role-name checks in UI.
- Navigation and action buttons are permission-aware; **backend remains authoritative**.
- No long-lived tokens in `localStorage`.

## API integration

- Base URL: `VITE_API_BASE_URL`
- Mock toggle: `VITE_ENABLE_MOCK_API`
- Query keys: `src/services/api/query-keys.ts`
- Errors normalized via `ApiError`
- Sensitive mutations support `Idempotency-Key` and `If-Match`

Provisional contracts are documented in `docs/API_CONTRACTS.md`. Replace with OpenAPI-generated clients when the NestJS spec is approved.

## Data tables

All operational lists use server pagination/sort/filter. URL state is synchronized for shareable views. Never download entire inventory/tender datasets into the browser.

## Financial & inventory safety

The frontend never treats optimistic client math as authoritative for:

- Stock posting / adjustments / reservations / dispatch
- Invoice finalization / payment allocation
- CDR release / contract amendments

Confirmations are required; success toasts only after API confirmation.

## Scaling posture

Frontend practices supporting the broader 3–4M concurrent-user platform objective:

- Route-level code splitting
- Paginated queries + stable cache keys
- Debounced search + abortable requests
- Aggregate dashboard endpoint (no client-side transaction aggregation)
- No giant global stores of business data

Capacity remains a backend/infrastructure concern and is not claimed proven by this UI.

## Multi-tenancy readiness

Cache keys, session organization label, and permission scopes are structured so tenant IDs can be introduced later without rewriting feature modules. No cross-company tenant admin is implemented.
