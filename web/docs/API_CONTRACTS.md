# Provisional API Contracts

> Status: **Provisional** until NestJS OpenAPI specification is approved.  
> Base path: `{VITE_API_BASE_URL}` (default `http://localhost:3000/api`)  
> Auth: cookie session + CSRF header when required (`X-CSRF-Token`)  
> Content-Type: `application/json` unless multipart upload

## Common patterns

### Pagination query

| Param | Type | Notes |
|---|---|---|
| `page` | number | 1-based |
| `pageSize` | number | default 20 |
| `q` | string | search |
| `sortBy` | string | field name |
| `sortDir` | `asc` \| `desc` | |
| filter fields | string | resource-specific (`status`, etc.) |

### Paginated response

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "nextCursor": null
  }
}
```

### Error body

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": { "sku": ["SKU already exists"] },
  "requestId": "req_..."
}
```

## Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{ email, password, rememberMe? }` → `{ session, requiresMfa? }` |
| POST | `/auth/logout` | clears session cookie |
| GET | `/auth/session` | current session or 401 |
| POST | `/auth/forgot-password` | `{ email }` |
| POST | `/auth/reset-password` | `{ token, password, confirmPassword }` |
| POST | `/auth/mfa/verify` | optional MFA |

## Resources (list + detail unless noted)

- `GET/POST /products`, `GET/PATCH /products/:id`
- `GET/POST /suppliers`, `GET/PATCH /suppliers/:id`
- `GET/POST /manufacturers`, `GET/PATCH /manufacturers/:id`
- `GET/POST /departments`, `GET/PATCH /departments/:id`
- `GET/POST /imports`, `GET/PATCH /imports/:id`
- `GET /inventory/stock`, `GET /inventory/movements`, `GET /inventory/warehouses`
- `GET/POST /tenders`, `GET/PATCH /tenders/:id`
- `GET /contracts`, `GET /contracts/:id`
- `GET/POST /securities`, `GET /securities/:id`
- `GET/POST /deliveries`, `GET /deliveries/:id`
- `POST /deliveries/:id/confirm-dispatch` — backend authoritative stock change
- `GET/POST /invoices`, `GET /invoices/:id`
- `POST /invoices/:id/finalize` — irreversible without amendment workflow
- `GET/POST /payments`, `GET /payments/:id`, `GET /receivables`
- `GET/POST /documents`, `GET /documents/:id`, upload via multipart
- `GET /approvals`, `POST /approvals/:id/approve|reject|return`
- `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`
- `GET /tasks`
- `GET /reports/catalog`, `POST /reports/jobs`, `GET /reports/jobs/:id`
- `GET /employees`, `GET /employees/:id`
- `GET /roles`
- `GET /audit`
- `GET/PATCH /settings/company`
- `GET /settings/health`
- `GET /dashboard` — aggregated KPIs (role-aware)
- `GET /search?q=` — permission-aware global search

## Sensitive mutation headers

- `Idempotency-Key`: UUID for finalize/dispatch/payment allocation
- `If-Match`: record version / ETag; conflicts return **409**

## Mobile compatibility

Path names and DTO shapes should remain compatible with the React Native client. Prefer additive changes; avoid renaming fields without versioning.
