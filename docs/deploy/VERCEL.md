# Deploy web admin on Vercel

Root directory for this service: **`web/`**.

## 1. Create the project

1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `web`.
3. Framework preset: Vite (also configured in [`web/vercel.json`](../../web/vercel.json)).
4. Build: `pnpm build` → output `dist`.

## 2. Environment variables

Use [`web/.env.production.example`](../../web/.env.production.example) as the template.

| Variable | Example | Required |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-api.up.railway.app/api` | Yes |
| `VITE_SOCKET_URL` | `https://your-api.up.railway.app` | Recommended |
| `VITE_ENABLE_MOCK_API` | `false` | Yes |
| `VITE_APP_NAME` | `Saru International` | Optional |
| `VITE_APP_ENV` | `production` | Optional |

Vite bakes `VITE_*` into the client bundle at **build** time. Change them → redeploy.

## 3. CORS / cookies on Railway

After you know the Vercel URL (e.g. `https://saru-admin.vercel.app`), set on Railway:

```env
WEB_ORIGIN=https://saru-admin.vercel.app
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
```

Then redeploy the API.

## 4. SPA routing

`vercel.json` rewrites unknown paths to `index.html` so React Router deep links work.

## 5. Verify

1. Open the Vercel URL → login with a seeded demo or real user.
2. Browser Network tab: API calls go to the Railway host with `credentials: include`.
3. Session cookie is set with `Secure; SameSite=None`.
4. Socket.IO connects to Railway `/socket.io` namespace `/realtime`.

## Preview deployments

For each preview URL you care about, either:

- Add it to Railway `WEB_ORIGIN` (comma-separated), or
- Use a single production Railway + production Vercel until auth is stable.
