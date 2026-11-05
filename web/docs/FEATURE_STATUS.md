# Feature Implementation Status

Legend:

- **Implemented** — UI + typed API + mock behavior working for the vertical slice
- **Configured** — screens/routes exist; backend dependency pending for full workflow
- **Planned** — navigation/contract prepared; feature-flagged or placeholder

| Module | Status | Notes / backend dependencies |
|---|---|---|
| Auth (login/logout/session/forgot) | Implemented | Cookie sessions; MFA UI ready when API supports |
| Permissions & protected routes | Implemented | Server remains authority |
| App shell / navigation / Cmd+K | Implemented | |
| Dashboard (role-aware) | Implemented | Requires `GET /dashboard` aggregates |
| Products list/detail/create/edit | Implemented | Duplicate SKU validation server-side |
| Suppliers / Manufacturers / Departments | Implemented | Performance metrics from verified backend records |
| Import shipments list/detail | Implemented | Landed cost calc backend-authoritative |
| Stock overview / movements / warehouses | Implemented | No client-side stock source of truth |
| Stock counts / transfers / FEFO / barcode | Configured | Placeholder routes; feature flags until backend rules approved |
| Tenders list/detail/create | Implemented | Stages configurable against backend workflow |
| Tender compliance / bid workspace depth | Configured | Checklist/bid deep UI pending |
| Contracts / awards | Implemented | Amendments backend-owned |
| CDR / securities | Implemented | Release not assumed from tender outcome |
| Deliveries list/detail | Implemented | Draft challan must not reduce stock |
| Challans depth | Configured | Placeholder until dispatch confirmation API finalized |
| Invoices + finalize confirmation | Implemented | Totals/tax backend-authoritative |
| Payments / receivables | Implemented | Not a full GL |
| Documents library | Implemented | Protected download URLs required |
| Approvals / My Tasks | Implemented | Workflow execution backend-owned |
| Notifications | Implemented | SSE/WebSocket optional later; no aggressive polling |
| Reports catalog | Implemented | Large exports via backend jobs still pending |
| Analytics depth | Configured | Placeholder |
| Employees / audit / settings / health | Implemented | Role matrix editor needs OpenAPI |
| Roles / templates / notification config / integrations | Configured | Config screens / placeholders only |
| Accounting / portal integrations | Planned | Not presented as connected |
| Offline drafts | Planned | Not enabled |
| Trip tracking | Planned | Feature-flagged |

## Demo accounts (mock mode only)

Password for all: `Demo@1234`

| Email | Role |
|---|---|
| owner@saru.demo | Owner / Super Administrator |
| tender@saru.demo | Tender Manager |
| import@saru.demo | Import Manager |
| inventory@saru.demo | Inventory Manager |
| docs@saru.demo | Documentation / Sales Officer |
| accounts@saru.demo | Accounts Officer |
| auditor@saru.demo | Read-Only / Auditor |

These are demonstration identities, not real credentials.

## Quality gates verified (this session)

- `pnpm typecheck` — pass
- `pnpm build` — pass
- `pnpm test` — pass (9 tests)
- `pnpm lint` — pass (0 errors; react-refresh export warnings only)
- `pnpm dev` — serves on http://localhost:5173
