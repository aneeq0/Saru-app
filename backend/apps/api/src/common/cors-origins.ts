const DEV_WEB_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
] as const;

/**
 * Resolve browser origins allowed for CORS / Socket.IO.
 * Production uses only WEB_ORIGIN (comma-separated). Dev merges localhost defaults.
 */
export function resolveWebOrigins(
  webOrigin: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): string[] {
  const configured = (webOrigin ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv === 'production') {
    return [...new Set(configured)];
  }

  return [...new Set([...configured, ...DEV_WEB_ORIGINS])];
}
