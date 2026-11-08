# syntax=docker/dockerfile:1
# Backend (NestJS). Monorepo ildizidan yig'iladi:
#   docker build -f deploy/api.Dockerfile -t sanat-api .

FROM node:22-bookworm-slim AS base
# openssl: Prisma uchun kerak. curl: salomatlik tekshiruvi uchun.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# ───────── Bog'liqliklar ─────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ───────── Yig'ish ─────────
FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @sanat/api exec prisma generate \
    && pnpm --filter @sanat/api build

# ───────── Ishga tushirish ─────────
FROM base AS runtime
ENV NODE_ENV=production
# Ildiz (root) huquqisiz foydalanuvchi: xavfsizlik uchun
USER node
WORKDIR /repo

COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /repo/apps/api/package.json ./apps/api/
# Migratsiya va boshlang'ich ma'lumot (lug'at) uchun
COPY --from=build --chown=node:node /repo/apps/api/prisma ./apps/api/prisma

WORKDIR /repo/apps/api
EXPOSE 4000
ENV API_HOST=0.0.0.0 API_PORT=4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/main.js"]
