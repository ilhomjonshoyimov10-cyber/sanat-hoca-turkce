# syntax=docker/dockerfile:1
# Frontend (Next.js, standalone). Monorepo ildizidan yig'iladi:
#   docker build -f deploy/web.Dockerfile --build-arg API_ORIGIN=https://api.example.uz -t sanat-web .

FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM deps AS build
# DIQQAT: NEXT_PUBLIC_* qiymatlari yig'ish paytida sahifalarga yoziladi,
# shuning uchun API manzili shu yerda berilishi shart.
ARG API_ORIGIN
ENV API_ORIGIN=$API_ORIGIN
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/web apps/web
RUN pnpm --filter web build

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
USER node
WORKDIR /app

# standalone: faqat kerakli fayllar (butun node_modules emas)
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public

WORKDIR /app/apps/web
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
