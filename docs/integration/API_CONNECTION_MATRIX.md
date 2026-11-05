# API Connection Matrix

**Status legend:** `PASS` (verified against live backend) · `PARTIAL` · `FAIL` · `NOT IMPLEMENTED` · `BLOCKED`

Initial statuses reflect **pre-fix audit**. Rows marked `PASS` only after genuine verification in `TEST_RESULTS.md`.

| Module | Frontend Screen | API Endpoint | HTTP Method | Authentication | Backend Service | Response Type | Real-Time Event | Status |
|---|---|---|---|---|---|---|---|---|
| Auth | Web Login | `/auth/login` | POST | Public → cookie | AuthController | SessionInfo | — | PARTIAL |
| Auth | Mobile Login | `/auth/login` | POST | Needs `X-Client: mobile` | AuthController | tokens + session | — | FAIL |
| Auth | Mobile Login (alt) | `/auth/mobile/login` | POST | Public | AuthController | tokens + session | — | PASS |
| Auth | Session | `/auth/session` | GET | Cookie/Bearer | AuthController | SessionInfo | — | PARTIAL |
| Auth | Logout | `/auth/logout` | POST | Cookie/Bearer | AuthController | void | — | PARTIAL |
| Auth | Mobile refresh | `/auth/mobile/refresh` | POST | Public body | AuthController | tokens | — | NOT IMPLEMENTED (client) |
| Auth | Web refresh | `/auth/web/refresh` | POST | Cookie | AuthController | session | — | PARTIAL |
| Profile | Me | `/auth/me` | GET | Auth | AuthController | user | `user.updated` | PARTIAL |
| Dashboard | Web/Mobile home | `/dashboard` | GET | `dashboard:view` | DashboardModule | DashboardPayload | dashboard metrics | PASS |
| Dashboard | Summary | `/dashboard/summary` | GET | `dashboard:view` | DashboardModule | counts | — | PARTIAL |
| Products | List | `/products` | GET | `products:view` | ProductsService | paginated | `product.*` | PARTIAL |
| Products | Detail | `/products/:id` | GET | `products:view` | ProductsService | Product | `product.updated` | PARTIAL |
| Products | Create | `/products` | POST | `products:create` | ProductsService | Product | `product.created` | PASS |
| Products | Update | `/products/:id` | PATCH | `products:edit_draft` | ProductsService | Product | `product.updated` | PARTIAL |
| Products | Barcode | `/products/barcode/:code` | GET | `products:view` | alias → lookup | Product | — | PARTIAL |
| Products | Barcode (BE) | `/products/lookup/barcode/:code` | GET | `products:view` | ProductsService | Product | — | PARTIAL |
| Catalogue | Categories | `/categories` | GET/POST | catalogue perms | CatalogueModule | list | — | PARTIAL |
| Catalogue | Manufacturers | `/manufacturers` | GET/POST | | CatalogueModule | list | — | PARTIAL |
| Catalogue | Suppliers | `/suppliers` | GET/POST | | CatalogueModule | list | — | PARTIAL |
| Catalogue | Departments | `/departments` | GET | | CatalogueModule | list | — | PARTIAL |
| Inventory | Stock (FE) | `/inventory/stock` | GET | `inventory:view` | alias → balances | StockBalance[] | `inventory.stock.changed` | PASS |
| Inventory | Balances (BE) | `/inventory/balances` | GET | `inventory:view` | InventoryService | StockBalance[] | `inventory.stock.changed` | PASS |
| Inventory | Movements | `/inventory/movements` | GET | `stock_movements:view` | InventoryService | list | — | PARTIAL |
| Inventory | Warehouses | `/warehouses` | GET | `warehouses:view` | InventoryService | list | — | PARTIAL |
| Inventory | Receipts UI | `/inventory/receipts` | GET | — | — | — | — | NOT IMPLEMENTED |
| Inventory | Reservations UI | `/inventory/reservations` | GET | — | schema exists | — | — | NOT IMPLEMENTED |
| Inventory | Stock counts UI | `/inventory/stock-counts` | GET | — | — | — | — | NOT IMPLEMENTED |
| Inventory | Transfers UI | `/inventory/transfers` | GET | — | — | — | — | NOT IMPLEMENTED |
| Imports | List/Detail | `/imports`, `/imports/:id` | GET | import perms | ImportsModule | shipment | `import.*` | PARTIAL |
| Imports | Create | `/imports` | POST | | ImportsModule | shipment | `import.created` | PARTIAL |
| Imports | Receipts | `/imports/:id/receipts` | POST | | ImportsModule | receipt | `import.receipt.*` | PARTIAL |
| Tenders | List/Create/Detail | `/tenders` | GET/POST | tender perms | TendersModule | tender | `tender.*` | PARTIAL |
| Tenders | Checklist | `/tenders/:id/checklist` | GET/POST | | TendersModule | items | `tender.checklist.updated` | PARTIAL |
| Tenders | Bids UI | `/tenders/bids` | GET | — | — | — | — | NOT IMPLEMENTED |
| Contracts | List/Detail | `/contracts` | GET | | ContractsModule | contract | `contract.*` | PARTIAL |
| Securities | CDR | `/securities` | GET/POST | | SecuritiesModule | instrument | `cdr.*` | PARTIAL |
| Deliveries | List/Detail | `/deliveries` | GET | | DeliveriesModule | delivery | `delivery.*` | PARTIAL |
| Deliveries | Confirm dispatch | `/deliveries/:id/confirm-dispatch` | POST | `deliveries:finalize` | DeliveriesModule | delivery | `delivery.dispatched` | PARTIAL |
| Deliveries | Challans UI | `/deliveries/challans` | GET | — | via delivery challan | — | — | NOT IMPLEMENTED |
| Invoices | List/Finalize | `/invoices`, `…/finalize` | GET/POST | | InvoicesModule | invoice | `invoice.*` | PARTIAL |
| Payments | List/Allocate | `/payments`, `…/allocate` | GET/POST | | PaymentsModule | payment | `payment.*` | PARTIAL |
| Payments | Receivables | `/receivables` | GET | | PaymentsModule | list | `receivable.balance.changed` | PARTIAL |
| Approvals | Inbox | `/approvals` | GET | | ApprovalsModule | list | `approval.*` | PARTIAL |
| Approvals | Decide | `/approvals/:id/approve\|reject\|return` | POST | `approvals:approve` | ApprovalsModule | request | `approval.*` | PARTIAL |
| Notifications | List | `/notifications` | GET | | NotificationsModule | list | `notification.created` | PARTIAL |
| Notifications | Mark read (BE) | `/notifications/:id/read` | POST | | NotificationsModule | void | `notification.read` | PARTIAL |
| Notifications | Mark read (mobile) | `/notifications/:id/read` | PATCH | | alias to POST | — | — | PARTIAL |
| Notifications | Preferences | `/notifications/preferences` | GET/PATCH | | NotificationsModule | prefs | — | PARTIAL |
| Push | Register token | `/devices/push-tokens` | POST | | NotificationsModule | token | — | PARTIAL |
| Tasks | FE `/tasks` | `/tasks` | GET | `dashboard:view` | TasksController alias | list | `task.*` | PASS |
| Tasks | BE | `/dashboard/tasks` / `/approvals/my-tasks` | GET | | Dashboard/Approvals | list | `task.*` | PARTIAL |
| Sync | Offline ops | `/sync/operations` | POST/GET | Auth | SyncModule | status | — | PARTIAL |
| Sync | Changes feed | `/sync/changes` | GET | Auth | SyncModule | events | — | PASS |
| Documents | Upload/List | `/documents/*` | mixed | | DocumentsModule | docs | `document.*` | PARTIAL |
| Reports | Catalog UI | `/reports/catalog` | GET | — | — | — | — | NOT IMPLEMENTED |
| Employees | Admin UI | `/employees` | GET | — | via users | — | — | NOT IMPLEMENTED |
| Settings | Roles/health | `/settings/*` | GET | — | health separate | — | — | NOT IMPLEMENTED |
| Audit | Admin UI | `/audit` | GET | — | AuditModule internal | — | — | NOT IMPLEMENTED |
| Realtime | Socket | `/socket.io` ns `/realtime` | WS | JWT/cookie | RealtimeGateway | events | * | PASS |

## Cross-app sync matrix (verification target)

See master prompt §20. Rows remain **FAIL/PARTIAL** until E2E scenarios A–J pass with mock API disabled.
