#!/usr/bin/env bash
# One-time: link this backend to Railway and set required variables.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v railway >/dev/null 2>&1; then
  echo "Installing Railway CLI via npx..."
  RAILWAY=(npx --yes @railway/cli@latest)
else
  RAILWAY=(railway)
fi

echo "Logging in / checking auth..."
"${RAILWAY[@]}" whoami || "${RAILWAY[@]}" login

echo "Link this folder to the Saru-app service when prompted..."
"${RAILWAY[@]}" link

SNIPPET="$(dirname "$0")/railway-env.snippet.env"
if [[ ! -f "$SNIPPET" ]]; then
  echo "Missing $SNIPPET — regenerate JWT secrets first."
  exit 1
fi

echo "Setting variables from snippet (excluding comments/blank)..."
while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  "${RAILWAY[@]}" variables --set "${key}=${val}"
done < "$SNIPPET"

echo "Link DATABASE_URL from Postgres (variable reference)..."
echo "If this fails, do it in the UI: Variables → New → Add Variable Reference → Postgres → DATABASE_URL"
"${RAILWAY[@]}" variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}" || true

echo "Done. Redeploy the Saru-app service."
