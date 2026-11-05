import { resolveWebOrigins } from './cors-origins';

describe('resolveWebOrigins', () => {
  it('merges localhost defaults outside production', () => {
    const origins = resolveWebOrigins('https://preview.example', 'development');
    expect(origins).toContain('https://preview.example');
    expect(origins).toContain('http://localhost:5173');
  });

  it('uses only configured origins in production', () => {
    const origins = resolveWebOrigins(
      'https://admin.vercel.app, https://admin.example.com',
      'production',
    );
    expect(origins).toEqual([
      'https://admin.vercel.app',
      'https://admin.example.com',
    ]);
  });

  it('returns empty list in production when unset', () => {
    expect(resolveWebOrigins(undefined, 'production')).toEqual([]);
  });
});
