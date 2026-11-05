# Frontend Sync Guide

## Disable mocks

**Web**

```bash
# web/.env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_API=false
# optional: VITE_SOCKET_URL=http://localhost:3000
```

**Mobile**

```bash
# mobile/.env or app.json extra
EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3000/api
EXPO_PUBLIC_ENABLE_MOCK_API=false
# optional: EXPO_PUBLIC_SOCKET_URL=http://<LAN-IP>:3000
```

Physical devices cannot reach the API via `localhost`.

## Web realtime

- Provider: `web/src/services/realtime/RealtimeProvider.tsx`
- Single Socket.IO connection per tab (cookie auth)
- Events → `applyRealtimeEvent` → coalesced TanStack Query invalidation
- Reconnect / window focus → `GET /sync/changes`

## Mobile realtime

- Provider: `mobile/src/services/realtime/RealtimeProvider.tsx`
- Auth via `handshake.auth.token` (access JWT from SecureStore)
- AppState resume → reconnect + invalidate active queries
- Background: do not assume the socket stays alive; use push later for wake-ups

## Auth notes

| Client | Login | Tokens |
|---|---|---|
| Web | `POST /auth/login` | HttpOnly cookies |
| Mobile | `POST /auth/mobile/login` | Bearer + refresh in SecureStore |

## Manual verification

1. Start Postgres, Redis, API.
2. Disable mocks on web + mobile.
3. Log in as `owner@saru.demo` / `Demo@1234` on both.
4. Create a product on web → mobile product list updates without pull-to-refresh (when both sockets connected).
5. Confirm dispatch / approvals similarly for authorized roles.
