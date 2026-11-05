# NestJS Backend Integration Guide

## 1. Disable mock API

```env
VITE_ENABLE_MOCK_API=false
VITE_API_BASE_URL=https://api.your-domain.tld/api
```

## 2. Session cookies

Configure NestJS to issue:

- HttpOnly
- Secure (production)
- SameSite=`None` when the admin (Vercel) and API (Railway) are on different sites; use `Lax` only for same-site local/proxy setups
- CSRF protection for cookie-authenticated mutating requests

Railway production:

```env
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
```

The frontend sends `credentials: 'include'` and reads `XSRF-TOKEN` cookie into `X-CSRF-Token` when present.

## 3. CORS

Allow the admin origin with credentials. Do not use `*` with cookies.

```env
WEB_ORIGIN=https://your-admin.vercel.app
```

See [`../../docs/deploy/OVERVIEW.md`](../../docs/deploy/OVERVIEW.md).

## 4. OpenAPI generation (recommended)

When the OpenAPI document is available:

1. Place it at `openapi/saru-api.json`
2. Generate types/client into `src/services/api/generated`
3. Replace provisional DTOs in `src/types` and feature `api/` modules
4. Keep query-key factories and UI unchanged where possible

## 5. Parity checklist with mobile

- Same auth session model (or documented token bridge for native)
- Same permission strings (`module:action`)
- Same pagination meta shape
- Same status enums for tenders, inventory, invoices, CDRs
- Same idempotency semantics on sensitive POSTs

## 6. Cutover verification

1. Login / session recovery / logout
2. 401 → redirect to login
3. 403 → unauthorized page (not empty data)
4. Product create validation errors map to fields
5. Invoice finalize conflict (409) shows refresh guidance
6. Document download uses authorized URL flow
7. Dashboard aggregates match SQL/reporting definitions

## 7. What not to do

- Do not fall back to MSW when production API fails
- Do not store JWTs in localStorage
- Do not trust client-only role checks for data access
- Do not ship hardcoded tax rates or regulatory wording
