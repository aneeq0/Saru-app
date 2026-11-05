# Architecture Overview

Saru International backend is a **modular NestJS monolith** serving both the React admin portal and the Expo mobile app from one API and one PostgreSQL database.

```
Clients (Web + Mobile)
        │
   Load balancer / local :3000
        │
   NestJS API (stateless)  ── Redis (cache / queues)
        │
   PostgreSQL (Prisma)     ── Private object storage (MinIO/S3)
        │
   Worker processes (BullMQ) — planned in apps/worker
```

## Domain modules

Auth, catalogue, imports/receiving, inventory (ledger + balances), tenders/contracts/securities, deliveries, invoices/payments, approvals, notifications, documents, sync, dashboard, audit.

Critical stock and finance mutations use PostgreSQL transactions and row-level locks (`SELECT … FOR UPDATE`) on balance projections. Draft deliveries never deduct stock.

## Tenancy

Single-company platform for Saru International. Multi-tenant SaaS is not in scope unless later approved.

## Capacity note

A future target of 3–4 million concurrent users is a planning objective. Horizontal API scaling, Redis, workers, and connection pooling are designed in; that target is not a measured production result.
