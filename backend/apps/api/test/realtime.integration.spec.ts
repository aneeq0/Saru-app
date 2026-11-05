/**
 * Integration checks for auth + outbox + sync changes + socket handshake.
 * Requires running Postgres (and optionally Redis). Skips if DATABASE_URL unreachable.
 */
import { io as ioClient, type Socket } from 'socket.io-client';

const API = process.env.API_BASE ?? 'http://127.0.0.1:3000/api';
const ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:3000';

async function loginMobile() {
  const res = await fetch(`${API}/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@saru.demo', password: 'Demo@1234' }),
  });
  if (!res.ok) throw new Error(`login failed ${res.status}`);
  return res.json() as Promise<{
    accessToken: string;
    refreshToken: string;
    session: { user: { id: string } };
  }>;
}

describe('Realtime integration', () => {
  let accessToken: string;
  let productId: string | undefined;

  beforeAll(async () => {
    const health = await fetch(
      `${API.replace(/\/api$/, '')}/api/health/live`,
    ).catch(() => null);
    if (!health?.ok) {
      console.warn('API not running — skipping realtime integration suite');
      return;
    }
    const login = await loginMobile();
    accessToken = login.accessToken;
  }, 30_000);

  it('authenticates mobile and fetches dashboard', async () => {
    if (!accessToken) return;
    const res = await fetch(`${API}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpis).toBeDefined();
  });

  it('lists inventory via /inventory/stock alias', async () => {
    if (!accessToken) return;
    const res = await fetch(`${API}/inventory/stock?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('creates product and writes outbox event', async () => {
    if (!accessToken) return;
    const sku = `RT-${Date.now()}`;
    // Need valid category/manufacturer from seed — discover via list
    const cats = await fetch(`${API}/categories?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    const mans = await fetch(`${API}/manufacturers?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    const categoryId = cats.data?.[0]?.id;
    const manufacturerId = mans.data?.[0]?.id;
    if (!categoryId || !manufacturerId) {
      console.warn('Missing catalogue seed — skip product create');
      return;
    }
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sku,
        name: 'Realtime Test Product',
        categoryId,
        manufacturerId,
        packagingUnit: 'BOX',
      }),
    });
    expect(res.status).toBeLessThan(300);
    const product = await res.json();
    productId = product.id;
    expect(productId).toBeTruthy();

    // Allow outbox publisher to process
    await new Promise((r) => setTimeout(r, 1500));
    const changes = await fetch(`${API}/sync/changes?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    const found = (
      changes.data as Array<{ type: string; entityId: string }>
    ).some((e) => e.type === 'product.created' && e.entityId === productId);
    expect(found).toBe(true);
  }, 20_000);

  it('connects Socket.IO with bearer auth', async () => {
    if (!accessToken) return;
    const socket: Socket = ioClient(`${ORIGIN}/realtime`, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: accessToken },
    });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('socket timeout')), 8000);
      socket.on('realtime:ready', () => {
        clearTimeout(t);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });
    socket.disconnect();
  }, 15_000);

  it('rejects socket token in query string', async () => {
    if (!accessToken) return;
    const socket: Socket = ioClient(`${ORIGIN}/realtime`, {
      path: '/socket.io',
      transports: ['websocket'],
      query: { token: accessToken },
    });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => resolve(), 5000);
      socket.on('realtime:ready', () => {
        clearTimeout(t);
        reject(new Error('should not authenticate via query'));
      });
      socket.on('disconnect', () => {
        clearTimeout(t);
        resolve();
      });
    });
    socket.disconnect();
  }, 10_000);
});
