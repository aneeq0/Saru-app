import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';
import { resolveWebOrigins } from '../common/cors-origins';
import { REALTIME_PATH } from './events';

/**
 * Socket.IO adapter with optional Redis pub/sub for multi-instance fan-out.
 * Falls back to in-process adapter when Redis is unavailable (local/dev).
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly log = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  constructor(
    app: INestApplication,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.log.warn(
        'REDIS_URL not set — Socket.IO multi-instance adapter disabled',
      );
      return;
    }
    try {
      this.pubClient = new Redis(url, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
      });
      this.subClient = this.pubClient.duplicate();
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
      this.log.log('Socket.IO Redis adapter connected');
    } catch (err) {
      this.log.warn(
        `Redis adapter unavailable (${err instanceof Error ? err.message : String(err)}); using in-memory adapter`,
      );
      this.adapterConstructor = null;
      try {
        this.pubClient?.disconnect();
        this.subClient?.disconnect();
      } catch {
        /* ignore */
      }
      this.pubClient = null;
      this.subClient = null;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const webOrigins = resolveWebOrigins(
      this.config.get<string>('WEB_ORIGIN'),
      this.config.get<string>('NODE_ENV'),
    );
    const server = super.createIOServer(port, {
      ...options,
      path: REALTIME_PATH,
      cors: {
        origin: webOrigins.length > 0 ? webOrigins : true,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25_000,
      pingTimeout: 20_000,
    });
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }

  // IoAdapter requires this signature; Redis clients disconnect synchronously.
  // eslint-disable-next-line @typescript-eslint/require-await -- base class is async
  async close(): Promise<void> {
    try {
      this.pubClient?.disconnect();
      this.subClient?.disconnect();
    } catch {
      /* ignore */
    }
  }
}
