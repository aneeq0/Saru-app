# Mobile ↔ NestJS Integration

1. Set `EXPO_PUBLIC_ENABLE_MOCK_API=false`
2. Set `EXPO_PUBLIC_API_BASE_URL` to the NestJS API (same as web)
3. Prefer bearer access token + refresh strategy agreed with backend (Secure Store only)
4. Keep DTO/permission parity with `web/docs/API_CONTRACTS.md`
5. Sensitive mutations: send `Idempotency-Key`; handle 409 conflicts
6. Document downloads: short-lived authorized URLs only
7. Never fall back to mock responses when production calls fail
