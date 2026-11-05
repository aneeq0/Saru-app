#!/bin/sh
# Railway entrypoint: migrate → seed (if empty) → API
set -eu

echo "[saru] starting Railway entrypoint"
echo "[saru] node=$(node -v)  port=${PORT:-unset}"

missing=""
for key in DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  eval "val=\${$key:-}"
  if [ -z "$val" ]; then
    missing="$missing $key"
  fi
done
if [ -n "$missing" ]; then
  echo "[saru] FATAL: missing required environment variables:$missing" >&2
  exit 1
fi

if [ -z "${WEB_ORIGIN:-}" ]; then
  echo "[saru] WARNING: WEB_ORIGIN is empty — Vercel browser calls will fail CORS" >&2
fi

echo "[saru] prisma migrate deploy..."
pnpm --filter @saru/database exec prisma migrate deploy --schema prisma/schema.prisma
echo "[saru] migrations OK"

echo "[saru] ensuring demo seed (idempotent upserts)..."
pnpm --filter @saru/database exec tsx prisma/seed.ts || {
  echo "[saru] WARNING: seed failed (login may not work until seed succeeds)" >&2
}

echo "[saru] launching Nest API..."
exec node apps/api/dist/main.js
