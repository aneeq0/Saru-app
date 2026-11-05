# syntax=docker/dockerfile:1.7
# Railway / production image for the NestJS API (pnpm workspace).
# Root directory for this service: `backend/`

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate
WORKDIR /app

FROM base AS deps
# argon2 (and similar native addons) need a C++ toolchain at install time
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/.npmrc ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --reporter=append-only

FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN pnpm prisma:generate
RUN pnpm build:api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/.npmrc ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/database ./packages/database
COPY --from=build /app/scripts ./scripts

RUN chmod +x /app/scripts/start-railway.sh

EXPOSE 3000

CMD ["sh", "scripts/start-railway.sh"]
