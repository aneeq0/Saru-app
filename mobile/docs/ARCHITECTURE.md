# Mobile Architecture — Saru International

React Native + Expo (SDK 58) + TypeScript client for day-to-day operations. Shares provisional NestJS API contracts with the web admin portal (`../web`).

## Stack

| Concern | Choice |
|---|---|
| Navigation | Expo Router (`src/app`) |
| Server state | TanStack Query |
| UI state | Zustand (auth/session UI only) |
| Forms | React Hook Form + Zod |
| Secure session | Expo Secure Store |
| Styling | Token-based StyleSheet (`src/theme/tokens.ts`) |
| Mock API | In-process mock gateway (RN-compatible) |

## Structure

```
mobile/
  app.json / eas.json
  src/
    app/           Expo Router screens
    components/    UI + feedback
    features/      domain hooks/api/store
    services/      api, auth, sync
    mocks/         demo datasets + mock router
    theme/         brand tokens
    types/         shared contracts
```

## Auth

- Short-lived access token + session payload stored in Secure Store (not AsyncStorage).
- Backend remains authoritative for permissions.
- Mock mode uses the same gateway interface as production.

## Safety rules

- Scanning never mutates inventory.
- Draft receiving/dispatch/POD never posts stock locally.
- Confirmations require backend success before success UI.
- Offline drafts (planned) must remain distinguishable from confirmed transactions.

## Alignment with web

Use the same path names, pagination meta, permission strings (`module:action`), and status enums documented in `../web/docs/API_CONTRACTS.md`.
