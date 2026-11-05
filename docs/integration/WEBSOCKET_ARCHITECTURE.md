# WebSocket Architecture

## Topology

```
[Web Admin] ──cookie──┐
                      ├── HTTP /api/* ──► NestJS REST (stateless instances)
[Mobile App] ─Bearer──┘                      │
                                             ▼
                                      PostgreSQL (SoT)
                                             │
                                      OutboxEvent rows
                                             │
                                      OutboxPublisher (in-process poll)
                                             ▼
[Web/Mobile Socket.IO] ◄── Redis adapter ── Socket.IO /realtime
```

## Paths

| Concern | Value |
|---|---|
| REST prefix | `/api` |
| Socket.IO path | `/socket.io` |
| Namespace | `/realtime` |
| TLS | Required in staging/production (WSS) |

## Multi-instance

`RedisIoAdapter` attaches `@socket.io/redis-adapter` when `REDIS_URL` is reachable. Business mutations on instance B still fan out to sockets on instance A.

Sticky sessions are recommended if HTTP long-polling is used across multiple gateways. Prefer WebSocket transport where possible.

## Recovery

Socket.IO reconnect alone is insufficient. Clients call `GET /api/sync/changes?cursor=` after reconnect / app resume / window focus.

## Security

- Authenticate every connection (JWT access token or session cookie).
- Reject tokens in query strings.
- Authorize `subscribe` room joins server-side.
- On user deactivation, revoke sessions and disconnect sockets (`RealtimeGateway.disconnectUser` available for wiring).
