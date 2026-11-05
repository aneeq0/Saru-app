# Notification Architecture

## Authoritative store

PostgreSQL `Notification` rows are authoritative for unread/read state, recipients, type, and related entity references.

## Flow (implemented)

1. Domain transaction commits with `OutboxEvent` (and optional `scope.userIds`).
2. `OutboxPublisherService` publishes Socket.IO envelopes.
3. When `scope.userIds` is set, publisher creates durable `Notification` rows (deduped within 60s) and emits `notification.created` to `user:{id}` rooms.
4. Online web/mobile clients invalidate notification queries.

## Flow (pending)

| Channel | Status |
|---|---|
| Expo push send + receipts | Token register/revoke only — **no BullMQ worker** |
| Email | Not implemented |
| Preference-gated delivery | Preferences API exists; not enforced on fan-out yet |
| Deep links | Scheme `saru` present; push handlers not wired |

## Deduplication keys

- In-app: same `(userId, type, entityType, entityId)` within 60 seconds skipped.
- Push (future): store ticket/receipt on delivery attempts; never re-alert infinitely for the same event reference.

## Client UX

- Web: notification list + subtle realtime connection status in header.
- Mobile: REST inbox + live invalidation while foregrounded.
- Do not treat push as guaranteed delivery.
