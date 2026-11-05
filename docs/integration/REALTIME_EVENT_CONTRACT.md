# Realtime Event Contract

**Schema version:** `1`  
**Transport:** Socket.IO namespace `/realtime`, path `/socket.io`  
**Client event name:** `realtime:event`  
**Auth:** Cookie session (web) or `handshake.auth.token` Bearer access JWT (mobile). Query-string tokens are rejected.

## Envelope

```ts
{
  eventId: string          // UUID; also outbox row id
  type: string             // e.g. inventory.stock.changed
  schemaVersion: number    // 1
  entityType: string       // Product | InventoryBalance | Tender | ...
  entityId: string
  entityVersion?: number
  occurredAt: string       // ISO-8601
  scope: {
    rooms?: string[]
    userIds?: string[]
    warehouseIds?: string[]
  }
  changeSummary: string    // safe, non-confidential
  correlationId?: string
  meta?: Record<string, string | number | boolean | null>
}
```

## Rules

1. Emit only after PostgreSQL commit via transactional outbox.
2. Payloads must not include passwords, tokens, payment credentials, or private document URLs.
3. Clients treat events as invalidation hints and refetch authoritative REST data.
4. Consumers must tolerate duplicates and out-of-order delivery (`eventId` + optional `entityVersion`).
5. Missed events: `GET /api/sync/changes?cursor=<iso>|<eventId>`.

## Canonical types

See `backend/apps/api/src/realtime/events.ts` (`RealtimeEventType`) and mirrored constants in:

- `web/src/services/realtime/events.ts`
- `mobile/src/services/realtime/events.ts`

## Rooms

| Room | Purpose |
|---|---|
| `user:{userId}` | Notifications, personal tasks |
| `warehouse:{warehouseId}` | Stock changes for a warehouse |
| `{entityType}:{entityId}` | Record watchers (server-authorized join) |

Clients may request `subscribe` / `unsubscribe`; the server enforces permissions.
