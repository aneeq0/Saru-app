# Deploy backend on Railway

Root directory for this service: **`backend/`**.

## 1. Create the project

1. New Railway project from this GitHub repo.
2. Set **Root Directory** to `backend`.
3. Railway will pick up [`backend/railway.toml`](../../backend/railway.toml) and build with [`backend/Dockerfile`](../../backend/Dockerfile).

## 2. Add plugins

Add **PostgreSQL** and **Redis** to the same project/service environment.

Map variables (Railway variable references):

| Variable | Source |
|---|---|
| `DATABASE_URL` | Postgres plugin |
| `REDIS_URL` | Redis plugin |
| `PORT` | Provided by Railway (do not hardcode) |

## 3. Set application env (required or the service crash-loops)

On the **Saru-app** service → **Variables**, set:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Use Railway variable reference from the Postgres service |
| `JWT_ACCESS_SECRET` | **Yes** | Long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Long random string (32+ chars) |
| `REDIS_URL` | Optional | Add a Redis plugin if you want multi-instance Socket.IO |
| `WEB_ORIGIN` | Recommended | Vercel admin origin(s), comma-separated |
| `SESSION_COOKIE_SECURE` | Prod | `true` |
| `SESSION_COOKIE_SAMESITE` | Prod | `none` |
| `NODE_ENV` | Recommended | `production` |
| `PORT` | Auto | Railway injects this — do not hardcode |

Example:

```env
NODE_ENV=production
API_BASE_PATH=api
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=<generate-long-random>
JWT_REFRESH_SECRET=<generate-long-random>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
WEB_ORIGIN=https://your-admin.vercel.app
SESSION_COOKIE_NAME=saru_session
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
CSRF_COOKIE_NAME=XSRF-TOKEN
LOG_LEVEL=info
```

`WEB_ORIGIN` must match the Vercel admin origin exactly (scheme + host, no trailing slash).

## 4. Deploy behavior

1. **preDeployCommand:** `pnpm run prisma:deploy` (migrations before traffic)
2. **startCommand:** `node apps/api/dist/main.js`
3. Health check: `GET /api/health/live` (300s timeout)

If the service shows **Crashed**, open **Deployments → Logs** and look for:
- `FATAL missing env` → Variables tab incomplete
- Prisma / P1001 → `DATABASE_URL` not linked to this service
- Bootstrap / JWT errors → secrets missing or invalid

## 5. Optional seed (once)

After the first successful deploy, run a one-off:

```bash
# From a Railway shell or local machine pointed at prod DATABASE_URL
pnpm prisma:seed
```

Do not seed production repeatedly.

## 6. Verify

```bash
curl -s https://<railway-host>/api/health/live
curl -s https://<railway-host>/api/health/ready
open https://<railway-host>/docs
```

## Notes

- Image listens on `0.0.0.0:$PORT`.
- Prisma binary target includes `debian-openssl-3.0.x` for the Docker base image.
- Object storage (`S3_*`) can stay MinIO locally; point at real S3/R2/etc. in production when you enable document uploads.
