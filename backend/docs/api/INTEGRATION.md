# Frontend Integration Guide

## Base URL

| Environment | Example |
|---|---|
| Local API | `http://localhost:3000/api` |
| Web Vite proxy / env | `VITE_API_BASE_URL=http://localhost:3000/api` |
| Expo | Use LAN IP, e.g. `http://192.168.x.x:3000/api` (not `localhost` on physical devices) |

OpenAPI UI: `http://localhost:3000/docs`

## Authentication

### Web (cookie session)

`POST /auth/login` with `{ email, password, rememberMe? }`

Sets HttpOnly `saru_session` (access) + `saru_refresh` cookies and readable `XSRF-TOKEN`.

Subsequent browser calls: `credentials: 'include'` and `X-CSRF-Token` from the CSRF cookie.

### Mobile (Bearer)

`POST /auth/mobile/login` or `POST /auth/login` with header `X-Client: mobile`

Response includes `accessToken` + `refreshToken`. Store in Secure Store. Send `Authorization: Bearer <accessToken>`.

Refresh: `POST /auth/mobile/refresh` with `{ refreshToken }`.

### Shared

- `GET /auth/session` → `SessionInfo`
- `POST /auth/logout`
- Demo users: `owner@saru.demo`, `tender@saru.demo`, `import@saru.demo`, `inventory@saru.demo`, `docs@saru.demo`, `accounts@saru.demo`, `auditor@saru.demo`
- Password: `Demo@1234`

## Response shapes

Paginated lists match the existing frontends:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Errors:

```json
{
  "statusCode": 422,
  "message": "The available stock is insufficient.",
  "code": "INSUFFICIENT_STOCK",
  "requestId": "..."
}
```

## Switching frontends off mocks

1. Start backend (see `docs/IMPLEMENTATION_STATUS.md`).
2. Web: set `VITE_ENABLE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:3000/api`.
3. Mobile: set API origin to the machine LAN address; disable mock gateway.
4. Verify login → products → imports → inventory on both clients against the same records.
