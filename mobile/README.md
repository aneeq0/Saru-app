# Saru International — Mobile App

Enterprise React Native (Expo) client for medical supply, inventory, tender, and delivery operations.

Part of the Saru platform:

- `../web` — Web Admin Portal
- `./` — Mobile Application
- NestJS backend (separate)

## Quick start

```bash
cd mobile
pnpm install
pnpm start
```

Then open in Expo Go, iOS simulator, or Android emulator.

### Demo sign-in (mock API)

Password for all: `Demo@1234`

| Email | Role |
|---|---|
| owner@saru.demo | Owner |
| inventory@saru.demo | Inventory Manager |
| tender@saru.demo | Tender Manager |
| accounts@saru.demo | Accounts Officer |

## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Expo dev server |
| `pnpm ios` / `pnpm android` | Platform launch |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test` | Jest |

## Environment

Copy `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_ENABLE_MOCK_API=true
```

Mock mode is **on by default**. Disable it when connecting to NestJS — never silently fall back to mocks on API failure.

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Feature status](./docs/FEATURE_STATUS.md)
- [Backend integration](./docs/BACKEND_INTEGRATION.md)
- [Continuation plan](./docs/CONTINUATION_PLAN.md)
- Shared contracts: [`../web/docs/API_CONTRACTS.md`](../web/docs/API_CONTRACTS.md)

## Safety notes

- Scanning never mutates stock
- Dispatch confirmation is backend-authoritative (idempotent)
- Sessions use Expo Secure Store — not AsyncStorage
