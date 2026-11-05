#!/bin/sh
# Optional all-in-one entrypoint (migrate + API).
# Prefer Railway preDeployCommand for migrations + `node apps/api/dist/main.js` as start.
set -eu

echo "[saru] starting Railway entrypoint"
echo "[saru] node=$(node -v)  port=${PORT:-unset}  cwd=$(pwd)"

missing=""
for key in DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  eval "val=\${$key:-}"
  if [ -z "$val" ]; then
    missing="$missing $key"
  fi
done

if [ -n "$missing" ]; then
  echo "[saru] FATAL: missing required environment variables:$missing" >&2
  echo "[saru] In Railway → Saru-app → Variables:" >&2
  echo "[saru]   - DATABASE_URL  (reference from the Postgres service)" >&2
  echo "[saru]   - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (long random strings)" >&2
  exit 1
fi

echo "[saru] running prisma migrate deploy..."
pnpm --filter @saru/database exec prisma migrate deploy --schema prisma/schema.prisma
echo "[saru] migrations OK"

echo "[saru] launching Nest API..."
exec node apps/api/dist/main.js
