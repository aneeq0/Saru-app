import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AuthChannel } from '@saru/database';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import type { AuthUserContext, SystemRole } from '../auth/auth.types';
import {
  EVENT_PERMISSION_GATES,
  REALTIME_NAMESPACE,
  REALTIME_PATH,
  RealtimeEventEnvelope,
  roomForEntity,
  roomForUser,
  roomForWarehouse,
} from './events';

function roomForPermission(permission: string) {
  return `perm:${permission}`;
}

type AuthedSocket = Socket & {
  data: {
    user?: AuthUserContext;
    subscriptions?: Set<string>;
  };
};

const MAX_SUBSCRIPTIONS = 64;

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  path: REALTIME_PATH,
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly connectionsByUser = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log(
      `Realtime gateway ready (ns=${REALTIME_NAMESPACE}, path=${REALTIME_PATH})`,
    );
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const user = await this.authenticateSocket(client);
      client.data.user = user;
      client.data.subscriptions = new Set();
      await client.join(roomForUser(user.id));
      for (const permission of user.permissions) {
        await client.join(roomForPermission(permission));
      }
      const set = this.connectionsByUser.get(user.id) ?? new Set();
      set.add(client.id);
      this.connectionsByUser.set(user.id, set);
      client.emit('realtime:ready', {
        userId: user.id,
        sessionId: user.sessionId,
        connectedAt: new Date().toISOString(),
      });
      this.logger.debug(`Socket connected user=${user.id} sid=${client.id}`);
    } catch (err) {
      this.logger.warn(
        `Socket auth failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      client.emit('realtime:error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const user = client.data.user;
    if (!user) return;
    const set = this.connectionsByUser.get(user.id);
    set?.delete(client.id);
    if (set && set.size === 0) this.connectionsByUser.delete(user.id);
  }

  @SubscribeMessage('subscribe')
  async onSubscribe(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: {
      scope: 'record' | 'warehouse' | 'dashboard' | 'notifications';
      entityType?: string;
      entityId?: string;
      warehouseId?: string;
    },
  ) {
    const user = client.data.user;
    if (!user) return { ok: false, error: 'UNAUTHORIZED' };

    const subs = client.data.subscriptions ?? new Set();
    if (subs.size >= MAX_SUBSCRIPTIONS) {
      return { ok: false, error: 'SUBSCRIPTION_LIMIT' };
    }

    let room: string | null = null;

    if (body.scope === 'notifications' || body.scope === 'dashboard') {
      room = roomForUser(user.id);
    } else if (body.scope === 'warehouse' && body.warehouseId) {
      if (
        !user.permissions.includes('inventory:view') &&
        !user.permissions.includes('warehouses:view')
      ) {
        return { ok: false, error: 'FORBIDDEN' };
      }
      room = roomForWarehouse(body.warehouseId);
    } else if (body.scope === 'record' && body.entityType && body.entityId) {
      if (!this.canWatchEntity(user, body.entityType)) {
        return { ok: false, error: 'FORBIDDEN' };
      }
      room = roomForEntity(body.entityType, body.entityId);
    }

    if (!room) return { ok: false, error: 'INVALID_SCOPE' };
    await client.join(room);
    subs.add(room);
    client.data.subscriptions = subs;
    return { ok: true, room };
  }

  @SubscribeMessage('unsubscribe')
  async onUnsubscribe(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { room: string },
  ) {
    if (!body?.room || body.room.startsWith('user:')) {
      return { ok: false, error: 'INVALID_ROOM' };
    }
    await client.leave(body.room);
    client.data.subscriptions?.delete(body.room);
    return { ok: true };
  }

  /** Publish a committed envelope to authorized rooms */
  publish(envelope: RealtimeEventEnvelope) {
    const rooms = new Set<string>();
    for (const r of envelope.scope.rooms ?? []) rooms.add(r);
    for (const uid of envelope.scope.userIds ?? []) rooms.add(roomForUser(uid));
    for (const wid of envelope.scope.warehouseIds ?? [])
      rooms.add(roomForWarehouse(wid));
    rooms.add(roomForEntity(envelope.entityType, envelope.entityId));

    const gates = EVENT_PERMISSION_GATES[envelope.type] ?? [];
    for (const permission of gates) {
      rooms.add(roomForPermission(permission));
    }

    // User-targeted notifications must not fan out via broad permission rooms
    if (envelope.scope.userIds?.length) {
      for (const permission of gates)
        rooms.delete(roomForPermission(permission));
    }

    for (const room of rooms) {
      this.server.to(room).emit('realtime:event', envelope);
    }
  }

  disconnectUser(userId: string) {
    const set = this.connectionsByUser.get(userId);
    if (!set) return;
    for (const sid of set) {
      this.server.sockets.sockets.get(sid)?.disconnect(true);
    }
  }

  activeConnectionCount(): number {
    let n = 0;
    for (const set of this.connectionsByUser.values()) n += set.size;
    return n;
  }

  private async authenticateSocket(
    client: AuthedSocket,
  ): Promise<AuthUserContext> {
    const authToken =
      (client.handshake.auth?.token as string | undefined) ||
      (typeof client.handshake.headers.authorization === 'string' &&
      client.handshake.headers.authorization.startsWith('Bearer ')
        ? client.handshake.headers.authorization.slice(7)
        : undefined);

    const cookieName = this.config.get<string>(
      'SESSION_COOKIE_NAME',
      'saru_session',
    );
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const cookieToken = parseCookie(cookieHeader)[cookieName];

    const token = authToken || cookieToken;
    if (!token) throw new Error('Missing credentials');

    // Reject long-lived secrets passed as query params
    if (client.handshake.query?.token || client.handshake.query?.accessToken) {
      throw new Error('Token in query string is not allowed');
    }

    const payload = await this.jwt.verifyAsync<{
      sub: string;
      sid: string;
      role: SystemRole;
      channel: AuthChannel;
    }>(token, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });

    return this.auth.validateAccessPayload(payload);
  }

  private canWatchEntity(user: AuthUserContext, entityType: string): boolean {
    const t = entityType.toLowerCase();
    const p = new Set(user.permissions);
    const map: Record<string, string[]> = {
      product: ['products:view'],
      productvariant: ['products:view'],
      importshipment: ['imports:view'],
      goodsreceipt: ['imports:view'],
      inventorybalance: ['inventory:view'],
      tender: ['tenders:view'],
      contract: ['contracts:view'],
      securityinstrument: ['securities:view'],
      delivery: ['deliveries:view'],
      invoice: ['invoices:view'],
      payment: ['payments:view'],
      approvalrequest: ['approvals:view'],
      document: ['documents:view'],
      notification: ['notifications:view'],
      user: ['employees:view'],
    };
    const need = map[t] ?? map[t.replace(/_/g, '')];
    if (!need) return false;
    return need.some((x) => p.has(x));
  }
}

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    if (k) out[k] = v;
  }
  return out;
}
